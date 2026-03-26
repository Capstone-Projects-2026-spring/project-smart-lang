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
    // Refresh suggestions when navigating between grids
    $(document).on(constants.EVENT_GRID_LOADED + ".predbar", () => {
      this.$nextTick(() => this.updateSuggestions());
    });
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
  background: #1a6bbf;
  border-bottom: 3px solid #0e4a8a;
}

/* ── Header label strip ───────────────────────────────────────────── */
.prediction-bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px 2px;
  gap: 8px;
}

.prediction-bar-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78em;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ffffff;
}

.prediction-bar-icon {
  font-size: 1.1em;
}

.prediction-bar-hint {
  font-size: 0.72em;
  color: #c8dff7;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Tiles row ────────────────────────────────────────────────────── */
.prediction-bar {
  display: flex;
  gap: 6px;
  padding: 4px 8px 6px;
  background: #1a6bbf;
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
  padding: 4px 5px;
  background: #ffffff;
  border: 2px solid #5fa8e8;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.12s, box-shadow 0.12s, background 0.12s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
}

.prediction-tile:hover,
.prediction-tile:active {
  transform: scale(1.06);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
  background: #e8f3ff;
  border-color: #1a6bbf;
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
  font-size: 0.72em;
  font-weight: 700;
  text-align: center;
  line-height: 1.15;
  color: #0d3d73;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding-top: 2px;
}

.prediction-placeholder {
  color: #c8dff7;
  font-style: italic;
  font-size: 0.95em;
  padding: 6px 0;
  align-self: center;
}

.expansion-tile {
  border-color: #f0a500;
  border-style: dashed;
  background-color: #fffbea !important;
}

.expansion-tile:hover,
.expansion-tile:active {
  background-color: #fff3c0 !important;
  border-color: #c27d00;
}

.expansion-indicator {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.65em;
  pointer-events: none;
}
</style>