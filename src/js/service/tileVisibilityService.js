import { dataService } from "./data/dataService.js";
import { gridUtil } from "../util/gridUtil.js";
import { GridElement } from "../model/GridElement.js";
import { GridData } from "../model/GridData.js";
import { GridActionNavigate } from "../model/GridActionNavigate.js";
import { GridImage } from "../model/GridImage.js";
import { i18nService } from "./i18nService.js";

let tileVisibilityService = {};

const GROUP_DISSOLUTION_THRESHOLD = 5;

function _isKeyboardGrid(grid) {
  if (grid.keyboardMode === GridData.KEYBOARD_ENABLED) return true;
  if (grid.keyboardMode === GridData.KEYBOARD_DISABLED) return false;
  let normalElems = grid.gridElements.filter(
    (e) => e.type === GridElement.ELEMENT_TYPE_NORMAL,
  );
  if (normalElems.length === 0) return false;
  let singleCharCount = normalElems.filter((e) => {
    let label = i18nService.getTranslation(e.label) || "";
    return label.length === 1;
  }).length;
  return singleCharCount / normalElems.length > 0.4;
}

function _isTileEmpty(elem) {
  let label = i18nService.getTranslation(elem.label) || "";
  let hasImage =
    elem.image &&
    (elem.image.url ||
      (elem.image.data && elem.image.data !== "_removed_") ||
      elem.image.author);
  return !label.trim() && !hasImage;
}

/**
 * Gets all tiles across all grids, grouped by grid, with metadata about each tile.
 * Excludes the global grid, keyboard grids, and empty tiles.
 * @return {Promise<Array<{grid: Object, gridLabel: string, tiles: Array}>>}
 */
tileVisibilityService.getAllTilesGroupedByGrid = async function () {
  let grids = await dataService.getGrids(false, true);
  let metadata = await dataService.getMetadata();
  grids = grids.filter((g) => g.id !== metadata.globalGridId);
  grids = grids.filter((g) => !_isKeyboardGrid(g));

  let result = [];
  for (let grid of grids) {
    let tiles = [];
    for (let elem of grid.gridElements) {
      if (elem.type !== GridElement.ELEMENT_TYPE_NORMAL) {
        continue;
      }
      if (_isTileEmpty(elem)) {
        continue;
      }
      let navGridId = elem.getNavigateGridId
        ? elem.getNavigateGridId()
        : _getNavigateGridId(elem);
      let isFolder = !!navGridId;
      let visibleChildCount = 0;
      if (isFolder) {
        let childGrid = grids.find((g) => g.id === navGridId);
        if (childGrid) {
          visibleChildCount = childGrid.gridElements.filter(
            (e) => !e.hidden && e.type === GridElement.ELEMENT_TYPE_NORMAL,
          ).length;
        }
      }
      tiles.push({
        id: elem.id,
        label: elem.label,
        image: elem.image,
        hidden: elem.hidden,
        isFolder: isFolder,
        navGridId: navGridId,
        visibleChildCount: visibleChildCount,
        additionalProps: elem.additionalProps || {},
      });
    }
    if (tiles.length > 0) {
      let visibleCount = tiles.filter((t) => !t.hidden).length;
      let hiddenCount = tiles.filter((t) => t.hidden).length;
      result.push({
        grid: { id: grid.id, label: grid.label },
        gridLabel: i18nService.getTranslation(grid.label) || grid.id,
        tiles: tiles,
        visibleCount: visibleCount,
        hiddenCount: hiddenCount,
        allVisible: hiddenCount === 0,
        allHidden: visibleCount === 0,
      });
    }
  }
  return result;
};

/**
 * Toggles visibility of a tile and handles group dissolution/re-creation.
 * @param {string} gridId - ID of the grid containing the tile
 * @param {string} elementId - ID of the tile element
 * @param {boolean} hidden - true to hide, false to show
 */
tileVisibilityService.setTileVisibility = async function (
  gridId,
  elementId,
  hidden,
) {
  let grid = await dataService.getGrid(gridId);
  if (!grid) return;

  let element = grid.gridElements.find((e) => e.id === elementId);
  if (!element) return;

  element.hidden = hidden;
  await dataService.saveGrid(grid);

  if (hidden) {
    await _checkAndDissolveGroup(gridId);
  } else {
    await _checkAndRecreateGroup(gridId, elementId);
  }

  await _syncParentFolderVisibility(gridId);
};

/**
 * Sets visibility on all non-empty NORMAL tiles in a grid.
 * @param {string} gridId - ID of the grid
 * @param {boolean} hidden - true to hide all, false to show all
 */
tileVisibilityService.setGroupVisibility = async function (gridId, hidden) {
  let grid = await dataService.getGrid(gridId);
  if (!grid) return;

  let changed = false;
  for (let elem of grid.gridElements) {
    if (elem.type !== GridElement.ELEMENT_TYPE_NORMAL) continue;
    if (_isTileEmpty(elem)) continue;
    if (elem.hidden !== hidden) {
      elem.hidden = hidden;
      changed = true;
    }
  }

  if (!changed) return;

  await dataService.saveGrid(grid);

  await _syncParentFolderVisibility(gridId);
};

/**
 * After hiding a tile on gridId, check if any parent grid's folder pointing
 * to gridId should be dissolved (< GROUP_DISSOLUTION_THRESHOLD visible tiles).
 */
async function _checkAndDissolveGroup(childGridId) {
  let allGrids = await dataService.getGrids(false, true);
  let metadata = await dataService.getMetadata();
  allGrids = allGrids.filter((g) => g.id !== metadata.globalGridId);

  let graphList = gridUtil.getGraphList(allGrids);
  let childNode = graphList.find((n) => n.grid.id === childGridId);
  if (!childNode) return;

  // Only dissolve if exactly one parent (to avoid ambiguity)
  if (!childNode.parents || childNode.parents.length !== 1) return;

  let parentNode = childNode.parents[0];
  let parentGrid = await dataService.getGrid(parentNode.grid.id);
  let childGrid = await dataService.getGrid(childGridId);
  if (!parentGrid || !childGrid) return;

  // Find the folder tile on the parent that navigates to this child
  let folderTile = parentGrid.gridElements.find((elem) => {
    return _getNavigateGridId(elem) === childGridId;
  });
  if (!folderTile) return;

  // Count visible NORMAL tiles in child grid
  let visibleCount = childGrid.gridElements.filter(
    (e) => !e.hidden && e.type === GridElement.ELEMENT_TYPE_NORMAL,
  ).length;

  if (visibleCount < GROUP_DISSOLUTION_THRESHOLD) {
    await _dissolveGroup(parentGrid, folderTile, childGrid);
  }
}

/**
 * Dissolves a group: moves visible tiles from childGrid to parentGrid,
 * removes the folder tile, tags moved tiles with origin data.
 */
async function _dissolveGroup(parentGrid, folderTile, childGrid) {
  let visibleTiles = childGrid.gridElements.filter((e) => !e.hidden);
  if (visibleTiles.length === 0) {
    // Just remove the folder tile if no visible children
    parentGrid.gridElements = parentGrid.gridElements.filter(
      (e) => e.id !== folderTile.id,
    );
    await dataService.saveGrid(parentGrid);
    return;
  }

  // Deep copy folder metadata for origin tracking
  let folderLabel = JSON.parse(JSON.stringify(folderTile.label));
  let folderImage = folderTile.image
    ? JSON.parse(JSON.stringify(folderTile.image))
    : null;
  let folderX = folderTile.x;
  let folderY = folderTile.y;

  // Remove folder tile from parent
  parentGrid.gridElements = parentGrid.gridElements.filter(
    (e) => e.id !== folderTile.id,
  );

  // Tag and place each visible tile on the parent grid
  for (let i = 0; i < visibleTiles.length; i++) {
    let tile = JSON.parse(JSON.stringify(visibleTiles[i]));
    tile.additionalProps = tile.additionalProps || {};
    tile.additionalProps.sourceGroupGridId = childGrid.id;
    tile.additionalProps.sourceGroupParentGridId = parentGrid.id;
    tile.additionalProps.sourceGroupFolderLabel = folderLabel;
    tile.additionalProps.sourceGroupFolderImage = folderImage;

    if (i === 0) {
      // First tile takes the folder's position
      tile.x = folderX;
      tile.y = folderY;
    } else {
      // Remaining tiles fill free spaces
      let freeCoords = gridUtil.getFreeCoordinates(parentGrid);
      if (freeCoords.length > 0) {
        tile.x = freeCoords[0].x;
        tile.y = freeCoords[0].y;
      } else {
        // Expand grid by placing at next available row
        let newPos = parentGrid.getNewXYPos
          ? parentGrid.getNewXYPos()
          : { x: 0, y: gridUtil.getHeightWithBounds(parentGrid) };
        tile.x = newPos.x;
        tile.y = newPos.y;
      }
    }

    parentGrid.gridElements.push(tile);
  }

  // Remove the moved visible tiles from the child grid (keep hidden ones)
  let movedIds = visibleTiles.map((t) => t.id);
  childGrid.gridElements = childGrid.gridElements.filter(
    (e) => !movedIds.includes(e.id),
  );

  await dataService.saveGrid(parentGrid);
  await dataService.saveGrid(childGrid);
}

/**
 * After unhiding a tile, check if enough tiles from the same dissolved group
 * are now visible to recreate the group.
 */
async function _checkAndRecreateGroup(gridId, elementId) {
  let grid = await dataService.getGrid(gridId);
  if (!grid) return;

  let element = grid.gridElements.find((e) => e.id === elementId);
  if (!element) return;

  let sourceGroupGridId =
    element.additionalProps && element.additionalProps.sourceGroupGridId;
  if (!sourceGroupGridId) return;

  let parentGridId = element.additionalProps.sourceGroupParentGridId;
  if (!parentGridId) return;

  // The tile might be on the parent grid (post-dissolution) or still on the parentGridId
  // We need to look at the parent grid for siblings
  let parentGrid;
  if (gridId === parentGridId) {
    parentGrid = grid;
  } else {
    parentGrid = await dataService.getGrid(parentGridId);
  }
  if (!parentGrid) return;

  // Find all visible siblings on the parent grid with the same source group
  let siblings = parentGrid.gridElements.filter(
    (e) =>
      e.additionalProps &&
      e.additionalProps.sourceGroupGridId === sourceGroupGridId &&
      !e.hidden,
  );

  if (siblings.length >= GROUP_DISSOLUTION_THRESHOLD) {
    let folderLabel = siblings[0].additionalProps.sourceGroupFolderLabel;
    let folderImage = siblings[0].additionalProps.sourceGroupFolderImage;
    await _recreateGroup(
      parentGrid,
      sourceGroupGridId,
      folderLabel,
      folderImage,
    );
  }
}

/**
 * Recreates a group: creates a folder tile on the parent, moves tracked
 * tiles back into the child grid, clears origin tracking.
 */
async function _recreateGroup(
  parentGrid,
  childGridId,
  folderLabel,
  folderImage,
) {
  let childGrid = await dataService.getGrid(childGridId);
  if (!childGrid) {
    // Clean up stale tracking props if child grid no longer exists
    for (let elem of parentGrid.gridElements) {
      if (
        elem.additionalProps &&
        elem.additionalProps.sourceGroupGridId === childGridId
      ) {
        delete elem.additionalProps.sourceGroupGridId;
        delete elem.additionalProps.sourceGroupParentGridId;
        delete elem.additionalProps.sourceGroupFolderLabel;
        delete elem.additionalProps.sourceGroupFolderImage;
      }
    }
    await dataService.saveGrid(parentGrid);
    return;
  }

  // Collect ALL tiles with this source group (visible or hidden)
  let siblings = parentGrid.gridElements.filter(
    (e) =>
      e.additionalProps && e.additionalProps.sourceGroupGridId === childGridId,
  );

  if (siblings.length === 0) return;

  // Use the first sibling's position for the new folder tile
  let folderX = siblings[0].x;
  let folderY = siblings[0].y;

  // Move siblings back to child grid
  for (let sibling of siblings) {
    let tile = JSON.parse(JSON.stringify(sibling));
    // Clear origin tracking
    delete tile.additionalProps.sourceGroupGridId;
    delete tile.additionalProps.sourceGroupParentGridId;
    delete tile.additionalProps.sourceGroupFolderLabel;
    delete tile.additionalProps.sourceGroupFolderImage;

    // Find a position in the child grid
    let freeCoords = gridUtil.getFreeCoordinates(childGrid);
    if (freeCoords.length > 0) {
      tile.x = freeCoords[0].x;
      tile.y = freeCoords[0].y;
    } else {
      tile.x = 0;
      tile.y = gridUtil.getHeightWithBounds(childGrid);
    }
    childGrid.gridElements.push(tile);
  }

  // Remove siblings from parent grid
  let siblingIds = siblings.map((s) => s.id);
  parentGrid.gridElements = parentGrid.gridElements.filter(
    (e) => !siblingIds.includes(e.id),
  );

  // Create new folder tile on parent
  let folderActions = [
    new GridActionNavigate({
      toGridId: childGridId,
      navType: GridActionNavigate.NAV_TYPES.TO_GRID,
    }),
  ];

  let folderElement = new GridElement({
    label: folderLabel,
    image: folderImage ? new GridImage(folderImage) : undefined,
    actions: folderActions,
    x: folderX,
    y: folderY,
    width: 1,
    height: 1,
  });

  parentGrid.gridElements.push(folderElement);

  await dataService.saveGrid(parentGrid);
  await dataService.saveGrid(childGrid);
}

/**
 * Helper: gets the navigate grid ID from an element's actions.
 */
function _getNavigateGridId(element) {
  if (!element || !element.actions) return null;
  let navAction = element.actions.find(
    (a) =>
      a.modelName === GridActionNavigate.getModelName() &&
      a.navType === GridActionNavigate.NAV_TYPES.TO_GRID,
  );
  return navAction ? navAction.toGridId : null;
}

/**
 * Syncs parent folder tile visibility based on child grid's visible tile count.
 * Hides the folder if all child tiles are hidden, shows it if any are visible.
 */
async function _syncParentFolderVisibility(childGridId) {
  let allGrids = await dataService.getGrids(false, true);
  let metadata = await dataService.getMetadata();
  allGrids = allGrids.filter((g) => g.id !== metadata.globalGridId);

  let childGrid = allGrids.find((g) => g.id === childGridId);
  if (!childGrid) return;

  let hasVisibleTiles = childGrid.gridElements.some(
    (e) =>
      !e.hidden &&
      e.type === GridElement.ELEMENT_TYPE_NORMAL &&
      !_isTileEmpty(e),
  );

  for (let grid of allGrids) {
    if (grid.id === childGridId) continue;
    let folderElem = grid.gridElements.find(
      (elem) => _getNavigateGridId(elem) === childGridId,
    );
    if (!folderElem) continue;
    if (folderElem.hidden === !hasVisibleTiles) continue;

    let fullGrid = await dataService.getGrid(grid.id);
    if (!fullGrid) continue;
    let fullElem = fullGrid.gridElements.find((e) => e.id === folderElem.id);
    if (!fullElem) continue;
    fullElem.hidden = !hasVisibleTiles;
    await dataService.saveGrid(fullGrid);
  }
}

export { tileVisibilityService };
