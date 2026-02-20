/**
 * predictionService.js
 *
 * Self-contained n-gram next-word prediction engine for AAC.
 * No external prediction libraries — just bigram/trigram frequency
 * counting with recency weighting, persisted to localStorage.
 *
 * How it works:
 *   1. On first launch, bootstrap() walks the grid structure and
 *      generates realistic AAC sentences ("I WANT PIZZA", etc.)
 *      to seed the n-gram model.
 *   2. Every tile tap teaches a bigram (prev → word) and trigram
 *      (prev2 + prev1 → word). Frequencies accumulate.
 *   3. getSuggestions(text) looks up the last 1–2 words in the
 *      trigram table (preferred) then bigram table (fallback),
 *      ranks by frequency, filters to real tile labels, and
 *      returns tile objects with images and colors.
 *   4. The model is saved to localStorage on every learn() and
 *      restored on init(). ~50KB typical size.
 */

import $ from "../externals/jquery.js";
import { GridElement } from "../model/GridElement";
import { dataService } from "./data/dataService";
import { constants } from "../util/constants";
import { localStorageService } from "./data/localStorageService.js";
import { i18nService } from "./i18nService.js";
import { MetaData } from "../model/MetaData";

let predictionService = {};

// ── N-gram model ────────────────────────────────────────────────────
// _bigrams:  { "I" : { "WANT": 12, "LIKE": 8, ... }, ... }
// _trigrams: { "I|WANT" : { "PIZZA": 5, "WATER": 3 }, ... }
// _unigrams: { "I": 40, "WANT": 25, ... }  (total frequency per word)
let _bigrams = {};
let _trigrams = {};
let _unigrams = {};

// ── User-learned model (written only by real tile taps, never bootstrap) ──
// Suggestions from these stores are appended at the END of the list so that
// freshly learned personal patterns show up immediately without displacing
// the existing curated suggestions.
let _userBigrams = {};
let _userTrigrams = {};

// Tracks the previous collect-bar word sequence so learnFromInput can
// detect which word was just added.
let _prevCollectWords = [];

const STORAGE_KEY = "aac_ngram_model_v1";
const BOOTSTRAP_KEY = "aac_ngram_bootstrapped_v1";
const SAVE_DEBOUNCE_MS = 2000;
let _saveTimer = null;

// ── Tile cache ──────────────────────────────────────────────────────
// lowercase label → { label, imageUrl, backgroundColor }
let _tileMap = new Map();

// Default tiles shown when the collect bar is empty (in priority order).
// This list is used directly by getSuggestions() and bypasses unigram scores,
// ensuring curated defaults always appear regardless of bootstrap inflation.
let _defaultSuggestionLabels = [
  "I",
  "WANT",
  "HELP",
  "I LIKE IT",
  "I DON'T LIKE IT",
  "STOP",
  "GIVE ME",
  "REST",
  "MORE",
  "YES",
  "NO",
  "OK",
];

// ── Legacy stubs (called by collectElementService, gridView, etc.) ──
// These are no-ops — the old prediction-element system is unused.
predictionService.predict = function () {};
predictionService.learnFromInput = function (text) {
  // Called by collectElementService on every tile tap with the full
  // collect-bar text.  We diff against the previous state to find the
  // word that was just added and learn from it immediately.
  let words = _tokenize(text);

  // Bar was cleared or a word was deleted — just reset state, no learning.
  if (words.length <= _prevCollectWords.length) {
    _prevCollectWords = words;
    return;
  }

  // A new word was appended at the end.
  let newWord  = words[words.length - 1];
  let prevWord = words.length >= 2 ? words[words.length - 2] : null;
  let prev2    = words.length >= 3 ? words[words.length - 3] : null;

  // Bigram: prevWord → newWord
  if (prevWord) {
    if (!_userBigrams[prevWord]) _userBigrams[prevWord] = {};
    _userBigrams[prevWord][newWord] = (_userBigrams[prevWord][newWord] || 0) + 1;
  }

  // Trigram: prev2 | prevWord → newWord
  if (prev2 && prevWord) {
    let key = prev2 + "|" + prevWord;
    if (!_userTrigrams[key]) _userTrigrams[key] = {};
    _userTrigrams[key][newWord] = (_userTrigrams[key][newWord] || 0) + 1;
  }

  _prevCollectWords = words;
  _scheduleSave();
};
predictionService.applyPrediction = function (input, prediction) {
  return (input || "") + prediction;
};
predictionService.getLastAppliedPrediction = function () {
  return null;
};
predictionService.doAction = function () {};
predictionService.getDictionaryKeys = function () {
  return [];
};
predictionService.initWithElements = async function () {};
predictionService.initIfNewUser = async function () {};
predictionService.stopAutosave = function () {};
predictionService.getCurrentValue = function () {
  return "";
};
predictionService.bootstrapAAC = function () {};
predictionService.setCurrentGridId = function () {};

// ── Init ─────────────────────────────────────────────────────────────

predictionService.init = async function () {
  log.debug("predictionService.init — loading n-gram model");
  _loadModel();
  return Promise.resolve();
};

// ── Tile cache builder ───────────────────────────────────────────────

predictionService.buildTileLabels = async function () {
  try {
    let grids = await dataService.getGrids(true);
    let metadata = await dataService.getMetadata();
    let tileMap = new Map();

    for (let grid of grids) {
      for (let elem of grid.gridElements || []) {
        if (elem.type !== GridElement.ELEMENT_TYPE_NORMAL) continue;
        let imageUrl = elem.image
          ? elem.image.data || elem.image.url || null
          : null;
        if (!imageUrl) continue;
        let label = i18nService.getTranslation(elem.label);
        if (!label) continue;
        let key = label.toUpperCase().trim();
        if (!tileMap.has(key)) {
          let bgColor = MetaData.getElementColor(elem, metadata);
          tileMap.set(key, {
            label: label,
            imageUrl: imageUrl,
            backgroundColor: bgColor || "#ffffff",
          });
        }
      }
    }

    _tileMap = tileMap;
    log.info("Tile cache: " + tileMap.size + " tiles");

    // Bootstrap on first launch
    if (!localStorage.getItem(BOOTSTRAP_KEY)) {
      _bootstrap(grids);
    }
  } catch (e) {
    log.warn("buildTileLabels failed", e);
  }
};

// ── Get suggestions ──────────────────────────────────────────────────

/**
 * Given the collect-bar text, return up to `count` tile objects
 * ranked by how likely they are to come next.
 */
predictionService.getSuggestions = function (input, count) {
  let desired = count || 6;
  let words = _tokenize(input);

  // When the collect bar is empty, return curated default suggestions
  // directly instead of using unigram scores (which are inflated by
  // bootstrap templates and would bury multi-word tiles like I LIKE IT).
  if (words.length === 0) {
    let results = [];
    for (let label of _defaultSuggestionLabels) {
      let tile = _tileMap.get(label);
      if (tile) {
        results.push(tile);
        if (results.length >= desired) break;
      }
    }
    return results;
  }

  let candidates = {}; // word -> score

  // 1) Trigram lookup: last two words
  if (words.length >= 2) {
    let key = words[words.length - 2] + "|" + words[words.length - 1];
    let tri = _trigrams[key];
    if (tri) {
      for (let w in tri) {
        candidates[w] = (candidates[w] || 0) + tri[w] * 3; // trigrams weighted 3x
      }
    }
  }

  // 2) Bigram lookup: last word
  if (words.length >= 1) {
    let lastWord = words[words.length - 1];
    let bi = _bigrams[lastWord];
    if (bi) {
      for (let w in bi) {
        candidates[w] = (candidates[w] || 0) + bi[w] * 2; // bigrams weighted 2x
      }
    }
  }

  // 3) If nothing yet (empty bar or no learned context), use unigram frequencies
  if (Object.keys(candidates).length === 0) {
    for (let w in _unigrams) {
      candidates[w] = _unigrams[w];
    }
  }

  // ── Collect user-learned candidates from the separate user model ──
  let userCandidates = {};
  if (words.length >= 2) {
    let key = words[words.length - 2] + "|" + words[words.length - 1];
    let tri = _userTrigrams[key];
    if (tri) {
      for (let w in tri) {
        userCandidates[w] = (userCandidates[w] || 0) + tri[w] * 3;
      }
    }
  }
  if (words.length >= 1) {
    let lastWord = words[words.length - 1];
    let bi = _userBigrams[lastWord];
    if (bi) {
      for (let w in bi) {
        userCandidates[w] = (userCandidates[w] || 0) + bi[w] * 2;
      }
    }
  }
  let hasUserCandidates = Object.keys(userCandidates).length > 0;

  // Sort by score descending
  let sorted = Object.entries(candidates).sort((a, b) => b[1] - a[1]);

  // Filter to real tile labels and build result array.
  // Reserve the last slot for user-learned items when they exist.
  let results = [];
  let seen = new Set();
  // Also exclude words already in the input to avoid repeating
  let inputWords = new Set(words);
  let baseLimit = hasUserCandidates ? desired - 1 : desired;

  for (let [word] of sorted) {
    if (seen.has(word)) continue;
    if (inputWords.has(word) && words.length > 0) continue;
    let tile = _tileMap.get(word);
    if (tile) {
      seen.add(word);
      results.push(tile);
      if (results.length >= baseLimit) break;
    }
  }

  // If we still don't have enough base suggestions, fill with top unigrams
  if (results.length < baseLimit) {
    let uniSorted = Object.entries(_unigrams).sort((a, b) => b[1] - a[1]);
    for (let [word] of uniSorted) {
      if (seen.has(word)) continue;
      if (inputWords.has(word) && words.length > 0) continue;
      let tile = _tileMap.get(word);
      if (tile) {
        seen.add(word);
        results.push(tile);
        if (results.length >= baseLimit) break;
      }
    }
  }

  // Append user-learned suggestions at the end (most-used first among them)
  if (hasUserCandidates) {
    let userSorted = Object.entries(userCandidates).sort((a, b) => b[1] - a[1]);
    for (let [word] of userSorted) {
      if (seen.has(word)) continue;
      if (inputWords.has(word) && words.length > 0) continue;
      let tile = _tileMap.get(word);
      if (tile) {
        seen.add(word);
        results.push(tile);
        if (results.length >= desired) break;
      }
    }
  }

  return results;
};

// ── Learn ────────────────────────────────────────────────────────────

/**
 * Teach the model that `word` followed `previousWord`.
 * Called on every tile tap from predictionBar.
 */
predictionService.learnWord = function (word, previousWord) {
  if (!word) return;
  let w = word.toUpperCase().trim();
  if (!w) return;

  // Write to user-learned bigrams only (not the bootstrap base model),
  // so personal patterns are tracked separately and shown at the end.
  if (previousWord) {
    let pw = previousWord.toUpperCase().trim();
    if (pw) {
      if (!_userBigrams[pw]) _userBigrams[pw] = {};
      _userBigrams[pw][w] = (_userBigrams[pw][w] || 0) + 1;
    }
  }

  _scheduleSave();
};

/**
 * Teach a trigram from the last 3 words of the collect bar.
 * Called from predictionBar after adding a word.
 */
predictionService.learnTrigram = function (word1, word2, word3) {
  if (!word1 || !word2 || !word3) return;
  let w1 = word1.toUpperCase().trim();
  let w2 = word2.toUpperCase().trim();
  let w3 = word3.toUpperCase().trim();
  if (!w1 || !w2 || !w3) return;

  // Write to user-learned trigrams only (not the bootstrap base model).
  let key = w1 + "|" + w2;
  if (!_userTrigrams[key]) _userTrigrams[key] = {};
  _userTrigrams[key][w3] = (_userTrigrams[key][w3] || 0) + 1;

  _scheduleSave();
};

// ── Bootstrap ────────────────────────────────────────────────────────

/**
 * Seed the n-gram model with realistic AAC sentences built from
 * the actual grid structure. Runs once on first launch.
 */
function _bootstrap(grids) {
  log.info("Bootstrapping n-gram model from grid structure...");

  // Clear any stale flags from previous prediction implementations
  localStorage.removeItem("aac_prediction_bootstrapped");
  localStorage.removeItem("aac_grid_bootstrapped_v2");
  localStorage.removeItem("aac_bootstrap_v3");
  localStorage.removeItem("aac_bootstrap_v4");

  // Map gridId → array of uppercase tile labels on that grid
  let gridLabels = new Map();
  for (let grid of grids) {
    let labels = [];
    for (let elem of grid.gridElements || []) {
      if (elem.type !== GridElement.ELEMENT_TYPE_NORMAL) continue;
      let label = i18nService.getTranslation(elem.label);
      if (!label) continue;
      let hasImage = elem.image && (elem.image.data || elem.image.url);
      if (hasImage) labels.push(label.toUpperCase().trim());
    }
    gridLabels.set(grid.id, labels);
  }

  // Walk navigate actions: parent tile → children on destination grid
  let categoryChildren = new Map();
  for (let grid of grids) {
    for (let elem of grid.gridElements || []) {
      if (!elem.actions) continue;
      for (let action of elem.actions) {
        if (
          action &&
          action.modelName === "GridActionNavigate" &&
          action.toGridId
        ) {
          let parentLabel = i18nService.getTranslation(elem.label);
          if (!parentLabel) continue;
          let children = gridLabels.get(action.toGridId) || [];
          if (children.length > 0) {
            let key = parentLabel.toUpperCase().trim();
            let existing = categoryChildren.get(key) || [];
            categoryChildren.set(key, existing.concat(children));
          }
        }
      }
    }
  }

  let count = 0;

  // Sentence templates: [starter words] × [category] → children
  let templates = [
    {
      starters: [["I", "WANT"]],
      cats: [
        "FOOD",
        "DRINKS",
        "TOYS",
        "CLOTHES",
        "ANIMALS",
        "OBJECTS",
        "APPLIANCES",
        "BATH",
        "REST",
        "HELP",
      ],
    },
    {
      starters: [["I", "LIKE"]],
      cats: [
        "FOOD",
        "DRINKS",
        "TOYS",
        "ANIMALS",
        "SPORTS",
        "COLORS",
        "LEISURE",
      ],
    },
    {
      starters: [["GIVE", "ME"]],
      cats: ["FOOD", "DRINKS", "TOYS", "CLOTHES", "OBJECTS"],
    },
    {
      starters: [
        ["I", "FEEL"],
        ["I", "AM"],
      ],
      cats: ["FEELINGS"],
    },
    { starters: [["GO", "TO"]], cats: ["PLACES", "HOME", "SCHOOL"] },
    {
      starters: [
        ["TALK", "TO"],
        ["I", "LIKE"],
      ],
      cats: ["PEOPLE"],
    },
    {
      starters: [["I", "SEE"]],
      cats: ["ANIMALS", "COLORS", "TRANSPORTS", "PLANTS"],
    },
    {
      starters: [["I", "WANT"]],
      cats: ["TRANSPORTS", "LEISURE", "SPORTS", "EVENTS"],
    },
    // Negation patterns (AAC users say "I NO WANT" instead of "I don't want")
    {
      starters: [["I", "NO"]],
      cats: ["VERBS"],
    },
    {
      starters: [["NO"]],
      cats: ["FOOD", "DRINKS", "TOYS", "CLOTHES"],
    },
    // WANT → objects (without "I" prefix)
    {
      starters: [["WANT"]],
      cats: ["FOOD", "DRINKS", "TOYS", "CLOTHES", "OBJECTS"],
    },
    // IT HURTS → body parts
    {
      starters: [["IT", "HURTS"]],
      cats: ["BODY"],
    },
    // EAT/DRINK → specific items
    { starters: [["EAT"]], cats: ["FOOD"] },
    { starters: [["DRINK"]], cats: ["DRINKS"] },
  ];

  for (let tmpl of templates) {
    for (let catName of tmpl.cats) {
      let children = categoryChildren.get(catName);
      if (!children || children.length === 0) continue;
      for (let child of children) {
        for (let starter of tmpl.starters) {
          // Teach the full chain: e.g. ["I", "WANT", "PIZZA"]
          let sentence = [...starter, child];
          _learnSentence(sentence, 1);
          count++;
        }
      }
    }
  }

  // Category tile → its children (FOOD → PIZZA, BREAD, ...)
  for (let [catName, children] of categoryChildren) {
    for (let child of children) {
      _learnBigram(catName, child, 3);
    }
  }

  // Auto-discover verb tiles that exist in the grid and seed them
  let verbTiles = [
    "EAT",
    "DRINK",
    "GO",
    "LISTEN",
    "SEE",
    "SMELL",
    "MAKE",
    "TALK TO",
    "HAVE",
    "GIVE",
    "WEAR",
    "SLEEP",
    "PLAY",
    "BUY",
    "VISIT",
    "TRAVEL",
    "COME",
    "RETURN",
    "THINK",
    "CRY",
    "LAUGH",
    "DISCUSS",
    "CELEBRATE",
    "WAIT",
  ];
  for (let verb of verbTiles) {
    if (_tileMap.has(verb)) {
      _learnBigram("WANT", verb, 3);
      _learnBigram("I", verb, 2);
      _learnBigram("NO", verb, 2);
    }
  }

  // ── Comprehensive bigram patterns ────────────────────────────────
  let starterBigrams = [
    // After I → verbs and common continuations
    ["I", "WANT", 10],
    ["I", "LIKE", 8],
    ["I", "NO", 7],
    ["I", "FEEL", 6],
    ["I", "AM", 6],
    ["I", "SEE", 5],
    ["I", "HAVE", 4],
    ["I", "MAKE", 3],
    ["I", "THINK", 3],

    // After YOU → verbs directed at another person
    ["YOU", "WANT", 4],
    ["YOU", "LIKE", 4],
    ["YOU", "ARE", 3],
    ["YOU", "HAVE", 3],

    // Multi-word tile internal bigrams (so the tokenized words connect)
    ["GIVE", "ME", 8],
    ["TALK", "TO", 6],
    ["GO", "TO", 6],
    ["COME", "BACK", 5],
    ["ABOUT", "ME", 4],
    ["IT", "HURTS", 5],
    ["DON'T", "LIKE", 4],
    ["LIKE", "IT", 4],

    // After WANT → action verbs
    ["WANT", "EAT", 6],
    ["WANT", "DRINK", 6],
    ["WANT", "PLAY", 5],
    ["WANT", "GO", 5],
    ["WANT", "REST", 5],
    ["WANT", "HELP", 5],
    ["WANT", "SLEEP", 4],
    ["WANT", "MAKE", 4],
    ["WANT", "SEE", 4],
    ["WANT", "LISTEN", 3],
    ["WANT", "COME", 3],

    // Negation patterns
    ["NO", "MORE", 5],
    ["NO", "WANT", 5],
    ["NO", "STOP", 4],
    ["NO", "I", 3],
    ["NO", "BAD", 3],

    // After STOP → follow-ups
    ["STOP", "IT", 4],
    ["STOP", "NO", 3],
    ["STOP", "I", 2],

    // After YES → continuation
    ["YES", "MORE", 4],
    ["YES", "I", 3],
    ["YES", "WANT", 3],

    // After OK → continuation
    ["OK", "I", 3],
    ["OK", "WANT", 3],
    ["OK", "YES", 2],

    // After BAD → reactions
    ["BAD", "HELP", 3],
    ["BAD", "STOP", 3],
    ["BAD", "I", 3],

    // After HELP → follow-ups
    ["HELP", "I", 3],
    ["HELP", "WANT", 3],
    ["HELP", "STOP", 2],

    // After MORE → what do you want more of
    ["MORE", "I", 2],
    ["MORE", "WANT", 2],
    ["MORE", "YES", 2],

    // After REST → continuation
    ["REST", "I", 2],
    ["REST", "YES", 2],
    ["REST", "MORE", 2],

    // ── Trailing-word follow-ups for multi-word tiles ──────────────
    // After "I LIKE IT" or "I DON'T LIKE IT" → last token is "IT"
    ["IT", "MORE", 3],
    ["IT", "YES", 3],
    ["IT", "I", 2],
    ["IT", "WANT", 2],
    ["IT", "NO", 2],
    ["IT", "STOP", 2],

    // After "COME BACK" → last token is "BACK"
    ["BACK", "I", 2],
    ["BACK", "WANT", 2],
    ["BACK", "YES", 2],

    // After feelings tiles → reactions
    ["HAPPY", "I", 2],
    ["HAPPY", "YES", 2],
    ["HAPPY", "MORE", 2],
    ["SAD", "HELP", 3],
    ["SAD", "I", 2],
    ["SAD", "BAD", 2],
    ["ANGRY", "STOP", 3],
    ["ANGRY", "NO", 3],
    ["ANGRY", "HELP", 2],
    ["TIRED", "REST", 4],
    ["TIRED", "SLEEP", 3],
    ["TIRED", "I", 2],
    ["SICK", "HELP", 4],
    ["SICK", "BAD", 3],
    ["NERVOUS", "HELP", 3],
    ["NERVOUS", "I", 2],
    ["CONFUSED", "HELP", 3],
    ["WORRIED", "HELP", 3],
  ];
  for (let [w1, w2, n] of starterBigrams) {
    _learnBigram(w1, w2, n);
  }

  // ── Explicit trigrams for key multi-word sequences ───────────────
  // After "I LIKE IT" or "I DON'T LIKE IT" (trigram LIKE|IT)
  _learnTrigram("LIKE", "IT", "MORE", 3);
  _learnTrigram("LIKE", "IT", "YES", 2);
  _learnTrigram("LIKE", "IT", "I", 2);

  // After "I WANT" → common verbs (trigram I|WANT)
  _learnTrigram("I", "WANT", "EAT", 4);
  _learnTrigram("I", "WANT", "DRINK", 4);
  _learnTrigram("I", "WANT", "PLAY", 3);
  _learnTrigram("I", "WANT", "GO", 3);
  _learnTrigram("I", "WANT", "REST", 3);
  _learnTrigram("I", "WANT", "HELP", 3);
  _learnTrigram("I", "WANT", "SLEEP", 2);

  // After "I NO" → negated verbs (trigram I|NO)
  _learnTrigram("I", "NO", "WANT", 4);
  _learnTrigram("I", "NO", "SEE", 3);
  _learnTrigram("I", "NO", "LIKE", 3);
  _learnTrigram("I", "NO", "EAT", 2);
  _learnTrigram("I", "NO", "DRINK", 2);

  // After "I FEEL" → feelings (trigram I|FEEL)
  _learnTrigram("I", "FEEL", "HAPPY", 2);
  _learnTrigram("I", "FEEL", "SAD", 2);
  _learnTrigram("I", "FEEL", "ANGRY", 2);
  _learnTrigram("I", "FEEL", "TIRED", 2);
  _learnTrigram("I", "FEEL", "SICK", 2);
  _learnTrigram("I", "FEEL", "NERVOUS", 2);

  // After "I AM" → states (trigram I|AM)
  _learnTrigram("I", "AM", "HAPPY", 2);
  _learnTrigram("I", "AM", "SAD", 2);
  _learnTrigram("I", "AM", "ANGRY", 2);
  _learnTrigram("I", "AM", "TIRED", 2);
  _learnTrigram("I", "AM", "SICK", 2);

  // After "IT HURTS" → body parts (trigram IT|HURTS)
  let bodyParts = categoryChildren.get("BODY") || [];
  for (let part of bodyParts) {
    if (part !== "IT HURTS") _learnTrigram("IT", "HURTS", part, 2);
  }

  // After "TALK TO" → people (trigram TALK|TO)
  let people = categoryChildren.get("PEOPLE") || [];
  for (let person of people) {
    _learnTrigram("TALK", "TO", person, 2);
  }

  // After "GO TO" → places (trigram GO|TO)
  let places = categoryChildren.get("PLACES") || [];
  for (let place of places) {
    _learnTrigram("GO", "TO", place, 2);
  }

  // ── Follow-up bigrams after category children ────────────────────
  // After tapping a food/drink item → suggest continuation words
  for (let catName of ["FOOD", "DRINKS"]) {
    let children = categoryChildren.get(catName) || [];
    for (let child of children) {
      _learnBigram(child, "MORE", 1);
      _learnBigram(child, "YES", 1);
      _learnBigram(child, "I", 1);
    }
  }

  // After tapping a person → suggest common follow-ups
  for (let person of people) {
    _learnBigram(person, "I", 1);
    _learnBigram(person, "HELP", 1);
    _learnBigram(person, "YES", 1);
  }

  _saveModel();
  localStorage.setItem(BOOTSTRAP_KEY, "true");
  log.info("Bootstrapped " + count + " sentences into n-gram model.");
}

// ── Internal helpers ─────────────────────────────────────────────────

function _learnSentence(words, weight) {
  weight = weight || 1;
  for (let i = 0; i < words.length; i++) {
    let w = words[i];
    _unigrams[w] = (_unigrams[w] || 0) + weight;

    // Bigram
    if (i > 0) {
      _learnBigram(words[i - 1], w, weight);
    }
    // Trigram
    if (i > 1) {
      let key = words[i - 2] + "|" + words[i - 1];
      if (!_trigrams[key]) _trigrams[key] = {};
      _trigrams[key][w] = (_trigrams[key][w] || 0) + weight;
    }
  }
}

function _learnBigram(prev, word, weight) {
  weight = weight || 1;
  if (!_bigrams[prev]) _bigrams[prev] = {};
  _bigrams[prev][word] = (_bigrams[prev][word] || 0) + weight;
}

function _learnTrigram(word1, word2, word3, weight) {
  weight = weight || 1;
  let key = word1 + "|" + word2;
  if (!_trigrams[key]) _trigrams[key] = {};
  _trigrams[key][word3] = (_trigrams[key][word3] || 0) + weight;
}

function _tokenize(text) {
  if (!text) return [];
  return text
    .toUpperCase()
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function _saveModel() {
  try {
    let data = JSON.stringify({
      b: _bigrams,
      t: _trigrams,
      u: _unigrams,
      ub: _userBigrams,
      ut: _userTrigrams,
    });
    localStorage.setItem(STORAGE_KEY, data);
  } catch (e) {
    log.warn("Failed to save n-gram model", e);
  }
}

function _loadModel() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      let data = JSON.parse(raw);
      _bigrams = data.b || {};
      _trigrams = data.t || {};
      _unigrams = data.u || {};
      _userBigrams = data.ub || {};
      _userTrigrams = data.ut || {};
      log.info(
        "Loaded n-gram model: " +
          Object.keys(_bigrams).length +
          " bigrams, " +
          Object.keys(_trigrams).length +
          " trigrams, " +
          Object.keys(_userBigrams).length +
          " user bigrams",
      );
    }
  } catch (e) {
    log.warn("Failed to load n-gram model", e);
    _bigrams = {};
    _trigrams = {};
    _unigrams = {};
    _userBigrams = {};
    _userTrigrams = {};
  }
}

function _scheduleSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    _saveModel();
    _saveTimer = null;
  }, SAVE_DEBOUNCE_MS);
}

// ── Event listeners (kept for compatibility) ────────────────────────

$(document).on(constants.EVENT_USER_CHANGING, () => {});
$(document).on(constants.EVENT_USER_CHANGED, () => {});
$(document).on(constants.EVENT_METADATA_UPDATED, () => {});

// Learn from every collect-bar change (fires unconditionally after every tile
// tap, regardless of image-mode or other conditions).
$(document).on(constants.EVENT_COLLECT_TEXT_CHANGED, (event, text) => {
  predictionService.learnFromInput(text || "");
});

export { predictionService };
