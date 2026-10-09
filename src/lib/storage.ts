// src/lib/storage.ts
// [Echo] 多題庫進度隔離 — 每個題庫的進度、錯題、紀錄完全分開
// key 格式:echo:{bankId}:{類型},不同題庫絕不互相污染

export interface QStat { correct: number; wrong: number; }
export interface MistakeEntry { id: string; timestamp: string; }
export interface GameRecord {
  date: string; score: number; total: number;
  mode: string; time: number; points: number;
}

const key = (bankId: string, type: string) => `echo:${bankId}:${type}`;

function read<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}
function write(k: string, val: unknown) {
  try { localStorage.setItem(k, JSON.stringify(val)); } catch { /* 容量滿等狀況靜默 */ }
}

export const loadStats = (bankId: string) => read<Record<string, QStat>>(key(bankId, 'stats'), {});
export const saveStat = (bankId: string, qId: string, correct: boolean) => {
  const stats = loadStats(bankId);
  const cur = stats[qId] ?? { correct: 0, wrong: 0 };
  if (correct) cur.correct++; else cur.wrong++;
  stats[qId] = cur;
  write(key(bankId, 'stats'), stats);
  return stats;
};

export const loadMistakes = (bankId: string) => read<MistakeEntry[]>(key(bankId, 'mistakes'), []);
export const addMistake = (bankId: string, qId: string) => {
  const list = loadMistakes(bankId);
  if (!list.some(m => m.id === qId)) {
    list.push({ id: qId, timestamp: new Date().toISOString() });
    write(key(bankId, 'mistakes'), list);
  }
  return list;
};
export const clearMistakes = (bankId: string) => write(key(bankId, 'mistakes'), []);

export const loadRecords = (bankId: string) => read<GameRecord[]>(key(bankId, 'records'), []);
export const addRecord = (bankId: string, rec: GameRecord) => {
  const list = loadRecords(bankId);
  list.unshift(rec);
  write(key(bankId, 'records'), list.slice(0, 50));
  return list;
};
