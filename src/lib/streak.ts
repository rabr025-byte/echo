// src/lib/streak.ts
// [Echo] 連續登入系統 — 每天首次打開記錄一天,中斷歸零
// 全域儲存(不綁題庫):echo:streak

export interface StreakData {
  current: number;          // 目前連續天數
  best: number;             // 歷史最佳
  lastDate: string;         // 最後登入日期 YYYY-MM-DD
  days: string[];           // 所有登入過的日期(月曆用,保留近 90 天)
}

const KEY = 'echo:streak';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function load(): StreakData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { current: 0, best: 0, lastDate: '', days: [] };
}

// 每次 App 打開呼叫:回傳最新資料 + 今天是否為「新的一天」(可用來放獎勵動畫)
export function checkInToday(): { data: StreakData; isNewDay: boolean } {
  const data = load();
  const today = todayStr();

  if (data.lastDate === today) {
    return { data, isNewDay: false }; // 今天已經記過
  }

  const isConsecutive = data.lastDate === yesterdayStr();
  data.current = isConsecutive ? data.current + 1 : 1;
  data.best = Math.max(data.best, data.current);
  data.lastDate = today;
  if (!data.days.includes(today)) data.days.push(today);
  data.days = data.days.slice(-90); // 保留近 90 天

  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
  return { data, isNewDay: true };
}

export const loadStreak = load;
