import { STORAGE_KEY, INITIAL_ENERGY } from './constants';

const DEFAULT_STATE = {
  currentDay: 1,
  energy: INITIAL_ENERGY,
  completedSteps: {},
  completedDays: [],
  usedEnergizers: [],
  introCompleted: false,
  dayIntroSeen: {},
  volume: 0.3
};

function getKey(projectId) {
  return projectId ? `${STORAGE_KEY}-${projectId}` : STORAGE_KEY;
}

export function loadState(projectId) {
  try {
    const saved = localStorage.getItem(getKey(projectId));
    if (saved) {
      return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Fehler beim Laden des Spielstands:', e);
  }
  return { ...DEFAULT_STATE };
}

export function saveState(state, projectId) {
  try {
    localStorage.setItem(getKey(projectId), JSON.stringify(state));
  } catch (e) {
    console.warn('Fehler beim Speichern:', e);
  }
}

export function resetState(projectId) {
  localStorage.removeItem(getKey(projectId));
  return { ...DEFAULT_STATE };
}
