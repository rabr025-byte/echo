// src/lib/daily.ts
// [Echo] 每日任務 — 每天 3 個小目標,全完成有慶祝
// key: echo:daily(全域,跨題庫)

export interface DailyQuest {
  id: string;
  label: string;
  target: number;
  progress: number;
  done: boolean;
}

export interface DailyState {
  date: string;
  quests: DailyQuest[];
  allDone: boolean;
}

const KEY = 'echo:daily';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const freshQuests = (): DailyQuest[] => ([
  { id: 'correct10', label: '答對 10 題', target: 10, progress: 0, done: false },
  { id: 'combo5', label: '拿下一次 5 連擊', target: 1, progress: 0, done: false },
  { id: 'finish1', label: '完成 1 場挑戰', target: 1, progress: 0, done: false },
]);

export function loadDaily(): DailyState {
  const today = todayStr();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d: DailyState = JSON.parse(raw);
      if (d.date === today) return d;
    }
  } catch { /* ignore */ }
  const fresh = { date: today, quests: freshQuests(), allDone: false };
  save(fresh);
  return fresh;
}

function save(d: DailyState) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

// 回傳 true = 這次更新讓「全部完成」達成(拿去放慶祝)
export function updateDaily(event: 'correct' | 'combo5' | 'finish'): boolean {
  const d = loadDaily();
  if (d.allDone) return false;
  for (const q of d.quests) {
    if (q.done) continue;
    if (event === 'correct' && q.id === 'correct10') q.progress++;
    if (event === 'combo5' && q.id === 'combo5') q.progress++;
    if (event === 'finish' && q.id === 'finish1') q.progress++;
    if (q.progress >= q.target) q.done = true;
  }
  const all = d.quests.every(q => q.done);
  const justAll = all && !d.allDone;
  d.allDone = all;
  save(d);
  return justAll;
}
