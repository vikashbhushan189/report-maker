/**
 * Saved Block Targets for Lakhpati Didi Entry Status Report
 * Supports pre-configured targets for KOTWA (6,963) and CHAKIA-PIPRA (9,340),
 * persistent storage in localStorage, and custom block target management.
 */

export const DEFAULT_BLOCK_TARGETS = {
  'KOTWA': {
    blockId: 'KOTWA',
    blockName: 'KOTWA',
    displayName: 'Kotwa Block (16 Panchayats • Target: 6,963)',
    district: 'PURBI CHAMPARAN',
    totalTarget: 6963,
    panchayats: {
      'POKHARA': 595,
      'MAHARANI BHOPTA': 549,
      'BHOPATPUR SOUTH': 545,
      'MACHHARGAWA': 554,
      'BHOPATPUR NORTH': 526,
      'JASAULI': 448,
      'BHAHARWA KALA WEST': 432,
      'KARARIYA': 408,
      'JAGIRAHA': 394,
      'KOTWA': 394,
      'JASAULI PATTI': 394,
      'AHIRAULIYA': 364,
      'DUMRA': 358,
      'BHAHARWA KALA EAST': 358,
      'BATHANA': 328,
      'GOPI CHHAPRA': 316
    }
  },
  'CHAKIA-PIPRA': {
    blockId: 'CHAKIA-PIPRA',
    blockName: 'CHAKIA-PIPRA',
    displayName: 'Chakia-Pipra Block (18 Panchayats • Target: 9,340)',
    district: 'PURBI CHAMPARAN',
    totalTarget: 9340,
    panchayats: {
      'HARPUR': 1040,
      'KUARPAR': 980,
      'RAMGARH MAHUWA': 724,
      'JAMUNIA': 712,
      'CHINTAMANPUR': 656,
      'BHIRKHIA': 644,
      'MADHUBAN BEDIBAN': 623,
      'HARDIYABAD': 545,
      'SAGAR': 540,
      'MADHURAPUR': 505,
      'BISHUNPURA': 448,
      'KUNRIA': 435,
      'MAHUAWA': 406,
      'CHAKWARA': 392,
      'BAISAHA': 350,
      'BARAMADIA': 310,
      'CHAKIA': 20,
      'KUNAWA': 10
    },
    targetList: [1040, 980, 724, 712, 656, 644, 623, 545, 540, 505, 448, 435, 406, 392, 350, 310, 20, 10]
  }
};

const STORAGE_KEY = 'lakhpati_saved_block_targets';

/**
 * Loads all saved block targets from localStorage merged with defaults
 */
export function getSavedBlockTargets() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_BLOCK_TARGETS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load saved block targets from localStorage:', e);
  }
  return { ...DEFAULT_BLOCK_TARGETS };
}

/**
 * Persists a block target preset into localStorage
 */
export function saveBlockTargetPreset(blockId, presetData) {
  try {
    const current = getSavedBlockTargets();
    const updated = {
      ...current,
      [blockId]: {
        ...presetData,
        blockId,
        blockName: presetData.blockName || blockId,
        totalTarget: Object.values(presetData.panchayats || {}).reduce((sum, v) => sum + (Number(v) || 0), 0)
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save block target preset to localStorage:', e);
    return getSavedBlockTargets();
  }
}

/**
 * Resets saved targets to official factory defaults
 */
export function resetBlockTargetsToDefault() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
  return { ...DEFAULT_BLOCK_TARGETS };
}

/**
 * Normalizes text for matching (e.g. "BHOPATPUR SOUTH" -> "bhopatpursouth")
 */
function normalizeName(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Applies a block target preset to manualValues object for all rows/panchayats
 */
export function applyTargetPresetToManualValues(preset, currentManualValues = {}, currentPanchayatNames = []) {
  if (!preset || !preset.panchayats) return currentManualValues;

  const updatedManual = { ...currentManualValues };
  const targetMap = preset.panchayats;
  const normalizedPresetMap = {};

  // 1. Populate all known panchayats from preset directly
  Object.entries(targetMap).forEach(([gpName, val]) => {
    const num = Number(val) || 0;
    updatedManual[`target_${gpName}`] = num;
    updatedManual[`col_target_${gpName}`] = num;
    normalizedPresetMap[normalizeName(gpName)] = num;
  });

  // 2. If we have actual current Panchayat names from active report, map them with normalized/fuzzy matching
  if (currentPanchayatNames && currentPanchayatNames.length > 0) {
    currentPanchayatNames.forEach((gpName, idx) => {
      const norm = normalizeName(gpName);
      let targetVal = normalizedPresetMap[norm];

      // Exact match or partial match
      if (targetVal === undefined) {
        const foundKey = Object.keys(normalizedPresetMap).find(k => norm.includes(k) || k.includes(norm));
        if (foundKey) {
          targetVal = normalizedPresetMap[foundKey];
        } else if (preset.targetList && preset.targetList[idx] !== undefined) {
          // Fallback by row index if list provided
          targetVal = preset.targetList[idx];
        }
      }

      if (targetVal !== undefined) {
        updatedManual[`target_${gpName}`] = targetVal;
        updatedManual[`col_target_${gpName}`] = targetVal;
      }
    });
  }

  return updatedManual;
}

/**
 * Automatically detects which block preset matches the uploaded/detected block name
 */
export function matchBlockPreset(blockName) {
  if (!blockName) return null;
  const norm = normalizeName(blockName);
  if (norm.includes('kotwa')) return 'KOTWA';
  if (norm.includes('chakiya') || norm.includes('chakia') || norm.includes('pipra')) return 'CHAKIA-PIPRA';
  return null;
}
