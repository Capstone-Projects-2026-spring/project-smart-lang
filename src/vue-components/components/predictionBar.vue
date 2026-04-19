<template>
  <div
    class="prediction-bar-wrapper"
    role="region"
    aria-label="Word suggestions"
  >
    <div class="prediction-bar-header">
      <span class="prediction-bar-title" aria-label="Suggestions">
        <span class="prediction-bar-icon" aria-hidden="true">💡</span>
        Suggestions
      </span>
      <span class="prediction-bar-hint"
        >Tap a word to add it to your sentence</span
      >
    </div>
    <div class="prediction-bar">
      <template v-if="suggestions.length > 0">
        <div
          v-for="(tile, index) in suggestions"
          :key="index"
          class="prediction-tile"
          :class="{ 'expansion-tile': tile.isExpansion }"
          @click="selectTile(tile)"
          :aria-label="
            (tile.isExpansion
              ? 'New vocabulary suggestion: '
              : 'Predicted word: ') + tile.label
          "
          role="button"
          tabindex="0"
        >
          <div
            class="expansion-indicator"
            v-if="tile.isExpansion"
            title="New vocabulary"
          >
            ✨
          </div>
          <div class="tile-img-container" v-if="tile.imageUrl">
            <img :src="tile.imageUrl" :alt="tile.label" class="tile-img" />
          </div>
          <div class="tile-label">{{ tile.label }}</div>
        </div>
      </template>
      <span v-else class="prediction-placeholder"
        >Tap tiles to see suggestions</span
      >
    </div>
  </div>
</template>

<script>
import $ from "../../js/externals/jquery.js";
import { predictionService } from "../../js/service/predictionService";
import { collectElementService } from "../../js/service/collectElementService";
import { speechService } from "../../js/service/speechService";
import { constants } from "../../js/util/constants";

const SUGGESTION_COUNT = 6;

export default {
  name: "PredictionBar",
  data() {
    return {
      suggestions: [],
    };
  },
  methods: {
    selectTile(tile) {
      if (!tile || !tile.label) return;
      let word = tile.label;
      speechService.speak(word);
      let currentText = (collectElementService.getText() || "").trim();
      let words = currentText.split(/\s+/).filter((w) => w);
      // Learn bigram: previousWord → word
      let previousWord = words.length > 0 ? words[words.length - 1] : undefined;
      predictionService.learnWord(word, previousWord);
      // Learn trigram: prev2 + prev1 → word
      if (words.length >= 2) {
        predictionService.learnTrigram(
          words[words.length - 2],
          words[words.length - 1],
          word,
        );
      }
      collectElementService.addPredictionWord(word, tile.imageUrl);
    },
    updateSuggestions() {
      let text = collectElementService.getText() || "";
      this.suggestions = predictionService.getSuggestions(
        text,
        SUGGESTION_COUNT,
      );
    },
  },
  mounted() {
    $(document).on(constants.EVENT_COLLECT_TEXT_CHANGED + ".predbar", () => {
      this.$nextTick(() => this.updateSuggestions());
    });
    // Note: Removed EVENT_GRID_LOADED handler - suggestions should only change
    // when tiles are added/removed from the sentence, not when navigating folders
    // Build tile cache + bootstrap, then show initial suggestions
    predictionService.buildTileLabels().then(() => {
      this.updateSuggestions();
    });
    setTimeout(() => this.updateSuggestions(), 3000);
  },
  beforeDestroy() {
    $(document).off(".predbar");
  },
};
</script>

<style scoped>
/* ── Outer wrapper ────────────────────────────────────────────────── */
.prediction-bar-wrapper {
  flex-shrink: 0;
  background: linear-gradient(to bottom, #f5f5f5, #e8e8e8);
  border-bottom: 2px solid #c0c0c0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ── Header label strip ───────────────────────────────────────────── */
.prediction-bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px 4px;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.prediction-bar-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75em;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #4a5568;
}

.prediction-bar-icon {
  font-size: 1.1em;
}

.prediction-bar-hint {
  font-size: 0.72em;
  color: #718096;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Tiles row ────────────────────────────────────────────────────── */
.prediction-bar {
  display: flex;
  gap: 8px;
  padding: 8px 10px 10px;
  background: transparent;
  flex-shrink: 0;
  min-height: 140px;
  max-height: 140px;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
}

.prediction-tile {
  position: relative;
  flex: 1 1 0;
  min-width: 70px;
  max-width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  background: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
}

.prediction-tile:hover,
.prediction-tile:active {
  transform: scale(1.04);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
  background: #f0f7ff;
}

.prediction-tile:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.tile-img-container {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

.tile-img {
  max-height: 90px;
  max-width: 100%;
  object-fit: contain;
}

.tile-label {
  flex: 0 0 auto;
  font-size: 0.75em;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  color: #1e3a5f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding-top: 4px;
}

.prediction-placeholder {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.95em;
  padding: 6px 0;
  align-self: center;
}

.expansion-tile {
  border-color: #f59e0b;
  border-style: dashed;
  background-color: #fffbeb !important;
}

.expansion-tile:hover,
.expansion-tile:active {
  background-color: #fef3c7 !important;
  border-color: #d97706;
}

.expansion-indicator {
  position: absolute;
  top: 3px;
  right: 5px;
  font-size: 0.7em;
  pointer-events: none;
}
</style>
