// src/lib/bankStore.ts
// [Echo] 題庫持久化 — 上傳的題庫存 localStorage,重開後仍在,可切換/刪除
// key: echo:banks(題庫清單) / echo:activeBank(目前使用中的 bankId)

import type { QuestionBank } from '../types/bank';

const BANKS_KEY = 'echo:banks';
const ACTIVE_KEY = 'echo:activeBank';

// 讀取所有已儲存的題庫
export function loadBanks(): QuestionBank[] {
  try {
    const raw = localStorage.getItem(BANKS_KEY);
    return raw ? JSON.parse(raw) as QuestionBank[] : [];
  } catch { return []; }
}

// 儲存題庫(同 bankId 覆蓋),回傳最新清單
export function saveBank(bank: QuestionBank): QuestionBank[] {
  const list = loadBanks().filter(b => b.bankId !== bank.bankId);
  list.push(bank);
  try { localStorage.setItem(BANKS_KEY, JSON.stringify(list)); } catch {
    throw new Error('儲存空間不足,請先刪除不用的題庫');
  }
  return list;
}

// 刪除題庫(連同它的進度、錯題、紀錄、幽靈一起清掉)
export function deleteBank(bankId: string): QuestionBank[] {
  const list = loadBanks().filter(b => b.bankId !== bankId);
  try {
    localStorage.setItem(BANKS_KEY, JSON.stringify(list));
    // 清掉這個題庫的所有相關資料
    Object.keys(localStorage)
      .filter(k => k.startsWith(`echo:${bankId}:`))
      .forEach(k => localStorage.removeItem(k));
    if (getActiveBankId() === bankId) localStorage.removeItem(ACTIVE_KEY);
  } catch { /* ignore */ }
  return list;
}

// 目前使用中的題庫 id
export const getActiveBankId = (): string | null => {
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
};

export const setActiveBankId = (bankId: string) => {
  try { localStorage.setItem(ACTIVE_KEY, bankId); } catch { /* ignore */ }
};

// 估算 localStorage 用量(MB),給使用者參考
export function storageUsage(): number {
  try {
    let total = 0;
    for (const k of Object.keys(localStorage)) {
      total += (localStorage.getItem(k)?.length ?? 0) + k.length;
    }
    return Math.round((total / 1024 / 1024) * 100) / 100;
  } catch { return 0; }
}
