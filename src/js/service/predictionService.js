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

const STORAGE_KEY = "aac_ngram_model_v1";
const BOOTSTRAP_KEY = "aac_ngram_bootstrapped_v1";
const SAVE_DEBOUNCE_MS = 2000;
let _saveTimer = null;

// ── Tile cache ──────────────────────────────────────────────────────
// lowercase label → { label, imageUrl, backgroundColor }
let _tileMap = new Map();

// ── Legacy stubs (called by collectElementService, gridView, etc.) ──
// These are no-ops — the old prediction-element system is unused.
predictionService.predict = function () {};
predictionService.learnFromInput = function () {};
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

  // Sort by score descending
  let sorted = Object.entries(candidates).sort((a, b) => b[1] - a[1]);

  // Filter to real tile labels and build result array
  let results = [];
  let seen = new Set();
  // Also exclude words already in the input to avoid repeating
  let inputWords = new Set(words);

  for (let [word] of sorted) {
    if (seen.has(word)) continue;
    if (inputWords.has(word) && words.length > 0) continue;
    let tile = _tileMap.get(word);
    if (tile) {
      seen.add(word);
      results.push(tile);
      if (results.length >= desired) break;
    }
  }

  // If we still don't have enough, fill with top unigrams
  if (results.length < desired) {
    let uniSorted = Object.entries(_unigrams).sort((a, b) => b[1] - a[1]);
    for (let [word] of uniSorted) {
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

  // Unigram
  _unigrams[w] = (_unigrams[w] || 0) + 1;

  // Bigram
  if (previousWord) {
    let pw = previousWord.toUpperCase().trim();
    if (pw) {
      if (!_bigrams[pw]) _bigrams[pw] = {};
      _bigrams[pw][w] = (_bigrams[pw][w] || 0) + 1;
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

  let key = w1 + "|" + w2;
  if (!_trigrams[key]) _trigrams[key] = {};
  _trigrams[key][w3] = (_trigrams[key][w3] || 0) + 1;

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
  ];

  for (let tmpl of templates) {
    for (let catName of tmpl.cats) {
      let children = categoryChildren.get(catName);
      if (!children || children.length === 0) continue;
      for (let child of children) {
        for (let starter of tmpl.starters) {
          // Teach the full chain: e.g. ["I", "WANT", "PIZZA"]
          let sentence = [...starter, child];
          _learnSentence(sentence, 2);
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

  // Common starters: what follows "I", "YOU", etc.
  let starterBigrams = [
    ["I", "WANT", 10],
    ["I", "LIKE", 8],
    ["I", "FEEL", 5],
    ["I", "AM", 5],
    ["I", "SEE", 4],
    ["I", "NEED", 4],
    ["YOU", "WANT", 4],
    ["YOU", "LIKE", 4],
    ["YOU", "ARE", 3],
    ["GIVE", "ME", 8],
    ["TALK", "TO", 5],
    ["GO", "TO", 5],
    ["COME", "BACK", 4],
    ["ABOUT", "ME", 3],
    ["I DON'T LIKE", "IT", 3],
    ["I LIKE", "IT", 3],
  ];
  for (let [w1, w2, n] of starterBigrams) {
    _learnBigram(w1, w2, n);
  }

  // Unigram starters (shown when collect bar is empty)
  let defaultStarters = {
    I: 20,
    YOU: 10,
    YES: 8,
    NO: 8,
    HELP: 7,
    STOP: 6,
    OK: 5,
    WANT: 5,
    MORE: 5,
    "GIVE ME": 4,
  };
  for (let [w, n] of Object.entries(defaultStarters)) {
    _unigrams[w] = (_unigrams[w] || 0) + n;
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
    let data = JSON.stringify({ b: _bigrams, t: _trigrams, u: _unigrams });
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
      log.info(
        "Loaded n-gram model: " +
          Object.keys(_bigrams).length +
          " bigrams, " +
          Object.keys(_trigrams).length +
          " trigrams",
      );
    }
  } catch (e) {
    log.warn("Failed to load n-gram model", e);
    _bigrams = {};
    _trigrams = {};
    _unigrams = {};
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

export { predictionService };
