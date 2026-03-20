<template>
  <div class="prediction-bar">
    <template v-if="suggestions.length > 0">
      <div
        v-for="(tile, index) in suggestions"
        :key="index"
        class="prediction-tile"
        :class="{ 'expansion-tile': tile.isExpansion }"
        :style="{ backgroundColor: '#ffffff' }"
        @click="selectTile(tile)"
        :aria-label="
          (tile.isExpansion
            ? 'New vocabulary suggestion: '
            : 'Predicted tile: ') + tile.label
        "
        role="button"
        tabindex="0"
      >
        <div
          class="expansion-indicator"
          v-if="tile.isExpansion"
          title="New vocabulary"
        >
          &#10024;
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
.prediction-bar {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  background: #e8ecf0;
  border-bottom: 2px solid #bbb;
  flex-shrink: 0;
  min-height: 150px;
  max-height: 150px;
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
  padding: 3px 4px;
  border: 2px solid #888;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.1s, box-shadow 0.1s;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.15);
}

.prediction-tile:hover,
.prediction-tile:active {
  transform: scale(1.05);
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
  border-color: #333;
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
  max-height: 100px;
  max-width: 100%;
  object-fit: contain;
}

.tile-label {
  flex: 0 0 auto;
  font-size: 0.7em;
  font-weight: 700;
  text-align: center;
  line-height: 1.1;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding-top: 1px;
}

.prediction-placeholder {
  color: #999;
  font-style: italic;
  font-size: 0.95em;
  padding: 6px 0;
  align-self: center;
}

.expansion-tile {
  border-color: #4a90d9;
  border-style: dashed;
  background-color: #f0f7ff !important;
}

.expansion-indicator {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.65em;
  color: #4a90d9;
  pointer-events: none;
}
</style>
