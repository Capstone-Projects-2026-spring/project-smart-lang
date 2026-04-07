<template>
  <div class="modal">
    <div class="modal-mask" style="z-index: 9999">
      <div class="modal-wrapper" @click.self="$emit('close')">
        <div class="modal-container" @keydown.esc="$emit('close')">
          <a
            class="inline close-button"
            href="javascript:void(0);"
            @click="$emit('close')"
            ><i class="fas fa-times"
          /></a>
          <div class="modal-header">
            <h1>{{ $t("manageTiles") }}</h1>
          </div>

          <div class="modal-body mt-5 row">
            <search-bar
              :placeholder="'searchTiles'"
              v-model="searchTerm"
              @input="filterTiles()"
              :debounce-time="300"
            ></search-bar>
          </div>

          <div v-if="loading" class="mt-5" style="text-align: center">
            <i class="fas fa-spinner fa-spin"></i> {{ $t("loading") }}
          </div>

          <div v-if="!loading" class="tile-groups-container">
            <div
              v-for="group in filteredGridGroups"
              :key="group.grid.id"
              class="tile-grid-group"
            >
              <div
                class="tile-group-header"
                @click="toggleGroupCollapse(group.grid.id)"
              >
                <div class="group-header-left">
                  <i
                    class="fas group-chevron"
                    :class="
                      collapsedGroups[group.grid.id]
                        ? 'fa-chevron-right'
                        : 'fa-chevron-down'
                    "
                  ></i>
                  <span class="group-name">{{ group.gridLabel }}</span>
                  <span class="tile-count"
                    >{{ group.visibleCount }}/{{ group.tiles.length }}</span
                  >
                </div>
                <label
                  class="group-toggle"
                  :title="
                    group.allVisible
                      ? $t('hideElement') + ' all'
                      : $t('show') + ' all'
                  "
                  @click.stop
                >
                  <input
                    type="checkbox"
                    :checked="group.allVisible"
                    :indeterminate.prop="
                      !group.allVisible && !group.allHidden
                    "
                    @change="toggleGroupVisibility(group)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div
                v-show="!collapsedGroups[group.grid.id]"
                class="tile-card-grid"
              >
                <div
                  v-for="tile in group.tiles"
                  :key="tile.id"
                  class="tile-card"
                  :class="{ 'tile-card-hidden': tile.hidden }"
                  @click="toggleVisibility(group.grid.id, tile)"
                  :title="getTileLabel(tile)"
                >
                  <div class="tile-card-visibility">
                    <i
                      class="fas"
                      :class="tile.hidden ? 'fa-eye-slash' : 'fa-eye'"
                    ></i>
                  </div>
                  <div class="tile-card-image">
                    <img
                      v-if="getTileImageSrc(tile)"
                      :src="getTileImageSrc(tile)"
                    />
                    <i
                      v-else-if="tile.isFolder"
                      class="fas fa-folder tile-placeholder-icon"
                    ></i>
                    <i
                      v-else-if="tile.image"
                      class="fas fa-image tile-placeholder-icon"
                      style="color: #888"
                    ></i>
                    <div v-else class="tile-no-image"></div>
                  </div>
                  <div class="tile-card-label">
                    {{ getTileLabel(tile) }}
                  </div>
                  <i
                    v-if="tile.isFolder"
                    class="fas fa-folder-open tile-folder-badge"
                    :title="$t('folder')"
                  ></i>
                </div>
              </div>
            </div>
            <div
              v-if="filteredGridGroups.length === 0 && searchTerm"
              class="mt-5"
              style="text-align: center; color: #888"
            >
              {{ $t("noSearchResults") }}
            </div>
          </div>

          <div class="modal-footer"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import "./../../css/modal.css";
import $ from "../../js/externals/jquery.js";
import { constants } from "../../js/util/constants.js";
import { tileVisibilityService } from "../../js/service/tileVisibilityService.js";
import { i18nService } from "../../js/service/i18nService.js";
import SearchBar from "../components/searchBar.vue";

export default {
  components: {
    SearchBar,
  },
  data() {
    return {
      loading: true,
      searchTerm: "",
      gridGroups: [],
      filteredGridGroups: [],
      collapsedGroups: {},
    };
  },
  created() {
    this.saveQueue = Promise.resolve();
    this.pendingOps = 0;
  },
  methods: {
    getTileLabel(tile) {
      return i18nService.getTranslation(tile.label) || "";
    },
    getTileImageSrc(tile) {
      if (!tile.image) return null;
      if (tile.image.url) return tile.image.url;
      if (tile.image.data && tile.image.data.length > 50) return tile.image.data;
      return null;
    },
    toggleGroupCollapse(gridId) {
      this.$set(this.collapsedGroups, gridId, !this.collapsedGroups[gridId]);
    },
    filterTiles() {
      if (!this.searchTerm || this.searchTerm.length < 1) {
        this.filteredGridGroups = this.gridGroups;
        return;
      }
      let term = this.searchTerm.toLocaleLowerCase();
      this.filteredGridGroups = this.gridGroups
        .map((group) => {
          let matchingTiles = group.tiles.filter((tile) => {
            let label = this.getTileLabel(tile).toLocaleLowerCase();
            return label.includes(term);
          });
          if (matchingTiles.length === 0) return null;
          let visibleCount = matchingTiles.filter((t) => !t.hidden).length;
          let hiddenCount = matchingTiles.filter((t) => t.hidden).length;
          return {
            grid: group.grid,
            gridLabel: group.gridLabel,
            tiles: matchingTiles,
            visibleCount: visibleCount,
            hiddenCount: hiddenCount,
            allVisible: hiddenCount === 0,
            allHidden: visibleCount === 0,
          };
        })
        .filter((group) => group !== null);
    },
    toggleVisibility(gridId, tile) {
      let newHidden = !tile.hidden;
      tile.hidden = newHidden;
      this.updateGroupCounts(gridId);
      let group = this.gridGroups.find((g) => g.grid.id === gridId);
      if (group) {
        this.syncParentFolderInModal(gridId, group.allHidden);
      }
      this.$forceUpdate();
      this.enqueue(async () => {
        await tileVisibilityService.setTileVisibility(
          gridId,
          tile.id,
          newHidden,
        );
      });
    },
    toggleGroupVisibility(group) {
      let newHidden = group.allVisible;
      for (let tile of group.tiles) {
        tile.hidden = newHidden;
      }
      this.updateGroupCounts(group.grid.id);
      this.syncParentFolderInModal(group.grid.id, newHidden);
      this.$forceUpdate();
      this.enqueue(async () => {
        await tileVisibilityService.setGroupVisibility(
          group.grid.id,
          newHidden,
        );
      });
    },
    syncParentFolderInModal(childGridId, shouldHideFolder) {
      for (let parentGroup of this.gridGroups) {
        let changed = false;
        for (let tile of parentGroup.tiles) {
          if (tile.isFolder && tile.navGridId === childGridId) {
            if (tile.hidden !== shouldHideFolder) {
              tile.hidden = shouldHideFolder;
              changed = true;
            }
          }
        }
        if (changed) {
          this.updateGroupCounts(parentGroup.grid.id);
        }
      }
    },
    enqueue(fn) {
      this.pendingOps++;
      this.saveQueue = this.saveQueue
        .then(fn)
        .catch((e) => console.warn("tile save error", e))
        .then(() => {
          this.pendingOps--;
          if (this.pendingOps === 0) {
            $(document).trigger(constants.EVENT_GRID_RERENDER);
          }
        });
    },
    updateGroupCounts(gridId) {
      let group = this.gridGroups.find((g) => g.grid.id === gridId);
      if (!group) return;
      group.visibleCount = group.tiles.filter((t) => !t.hidden).length;
      group.hiddenCount = group.tiles.filter((t) => t.hidden).length;
      group.allVisible = group.hiddenCount === 0;
      group.allHidden = group.visibleCount === 0;
    },
    async loadTiles() {
      this.loading = true;
      this.gridGroups =
        await tileVisibilityService.getAllTilesGroupedByGrid();
      this.filterTiles();
      this.loading = false;
    },
  },
  async mounted() {
    await this.loadTiles();
  },
};
</script>

<style scoped>
.modal-container {
  min-height: 50vh;
  max-height: 85vh;
}

.tile-groups-container {
  margin-top: 1em;
}

.tile-grid-group {
  margin-bottom: 0.8em;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.tile-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6em 0.8em;
  background: #f5f5f5;
  cursor: pointer;
  user-select: none;
}

.tile-group-header:hover {
  background: #ebebeb;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 0.5em;
  min-width: 0;
}

.group-chevron {
  font-size: 0.8em;
  color: #666;
  width: 14px;
  text-align: center;
}

.group-name {
  font-weight: bold;
  font-size: 0.95em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile-count {
  font-weight: normal;
  color: #888;
  font-size: 0.85em;
  white-space: nowrap;
}

.tile-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 6px;
  padding: 8px;
  background: #fafafa;
}

.tile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  border: 2px solid #4caf50;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: opacity 0.2s, border-color 0.2s;
  min-height: 80px;
}

.tile-card:hover {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.tile-card-hidden {
  opacity: 0.4;
  border-color: #ccc;
}

.tile-card-visibility {
  position: absolute;
  top: 2px;
  right: 3px;
  font-size: 0.65em;
  color: #4caf50;
}

.tile-card-hidden .tile-card-visibility {
  color: #999;
}

.tile-card-image {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tile-card-image img {
  max-width: 40px;
  max-height: 40px;
  object-fit: contain;
}

.tile-placeholder-icon {
  font-size: 1.5em;
  color: #b8860b;
}

.tile-no-image {
  width: 40px;
  height: 40px;
}

.tile-card-label {
  font-size: 0.75em;
  text-align: center;
  line-height: 1.2;
  max-height: 2.4em;
  overflow: hidden;
  word-break: break-word;
  width: 100%;
  margin-top: 2px;
}

.tile-folder-badge {
  position: absolute;
  top: 2px;
  left: 3px;
  font-size: 0.6em;
  color: #b8860b;
}

/* Group toggle switch styles */
.group-toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  cursor: pointer;
}

.group-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.group-toggle .toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 22px;
}

.group-toggle .toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.group-toggle input:checked + .toggle-slider {
  background-color: #4caf50;
}

.group-toggle input:checked + .toggle-slider:before {
  transform: translateX(18px);
}

.group-toggle input:indeterminate + .toggle-slider {
  background-color: #ff9800;
}

.group-toggle input:indeterminate + .toggle-slider:before {
  transform: translateX(9px);
}

@media (max-width: 500px) {
  .tile-card-grid {
    grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
    gap: 4px;
    padding: 6px;
  }
  .tile-card {
    min-height: 70px;
    padding: 4px 2px;
  }
  .tile-card-image {
    width: 32px;
    height: 32px;
  }
  .tile-card-image img {
    max-width: 32px;
    max-height: 32px;
  }
}
</style>
