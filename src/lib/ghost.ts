// src/lib/ghost.ts
// [Echo] 幽靈對手 — 記錄每局「每一題答完的時間點」,下次同模式同題庫時,
// 上次的你變成幽靈進度,你跟過去的自己賽跑
// key: echo:{bankId}:ghost:{mode}

export interface GhostRun {
  timestamps: number[];  // 第 i 題答完時的累計秒數
  score: number;
  total: number;
  date: string;
}

const key = (bankId: string, mode: string) => `echo:${bankId}:ghost:${mode}`;

export function loadGhost(bankId: string, mode: string): GhostRun | null {
  try {
    const raw = localStorage.getItem(key(bankId, mode));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// 只在成績更好(或首次)時存新幽靈:分數優先,同分比速度
export function saveGhostIfBetter(bankId: string, mode: string, run: GhostRun) {
  const prev = loadGhost(bankId, mode);
  const better = !prev
    || run.score > prev.score
    || (run.score === prev.score && (run.timestamps[run.timestamps.length - 1] ?? Infinity) < (prev.timestamps[prev.timestamps.length - 1] ?? Infinity));
  if (better) {
    try { localStorage.setItem(key(bankId, mode), JSON.stringify(run)); } catch { /* ignore */ }
    return true; // 破紀錄
  }
  return false;
}
