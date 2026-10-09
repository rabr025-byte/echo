// src/lib/settings.ts
// [Echo] AI 與偏好設定的儲存(存本機 localStorage)
import type { AISettings } from './ai/types';
import { DEFAULT_SETTINGS } from './ai/types';

const KEY = 'echo:settings';

export function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export function saveSettings(s: AISettings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
