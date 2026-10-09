// src/lib/validateBank.ts
// [Echo] 題庫驗證器 — 使用者上傳的 JSON 一定會出錯,這裡用人話回報問題

import type { QuestionBank } from '../types/bank';

export interface ValidateResult {
  ok: boolean;
  errors: string[];
  bank?: QuestionBank;
}

export function validateBank(raw: unknown): ValidateResult {
  const errors: string[] = [];

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, errors: ['檔案不是有效的 JSON 物件'] };
  }
  const b = raw as Record<string, unknown>;

  if (!b.bankId || typeof b.bankId !== 'string')
    errors.push('缺少「bankId」(題庫識別碼,不同題庫不能相同)');
  if (!b.displayName || typeof b.displayName !== 'string')
    errors.push('缺少「displayName」(顯示名稱)');
  if (!Array.isArray(b.questions))
    errors.push('缺少「questions」題目陣列');

  if (Array.isArray(b.questions)) {
    if (b.questions.length === 0) errors.push('題目陣列是空的');
    const seenIds = new Set<string>();
    b.questions.forEach((q: unknown, i: number) => {
      const n = i + 1;
      if (typeof q !== 'object' || q === null) { errors.push(`第 ${n} 題不是有效物件`); return; }
      const qq = q as Record<string, unknown>;
      if (!qq.id) errors.push(`第 ${n} 題缺少 id`);
      else if (seenIds.has(String(qq.id))) errors.push(`第 ${n} 題 id「${qq.id}」重複`);
      else seenIds.add(String(qq.id));
      if (!qq.question || typeof qq.question !== 'string') errors.push(`第 ${n} 題缺少題目文字`);
      const isEssay = qq.type === 'essay';
      if (isEssay) {
        // 申論題:不檢查選項/answer,建議有 rubric
        if (!qq.rubric || typeof qq.rubric !== 'string')
          errors.push(`第 ${n} 題是申論題,建議提供 rubric(評分要點)讓 AI 評分更準`);
      } else {
        if (!Array.isArray(qq.options) || qq.options.length < 2) errors.push(`第 ${n} 題選項少於 2 個`);
        if (typeof qq.answer !== 'number') errors.push(`第 ${n} 題缺少正解 answer(數字)`);
        else if (Array.isArray(qq.options) && (qq.answer < 0 || qq.answer >= qq.options.length))
          errors.push(`第 ${n} 題正解索引 ${qq.answer} 超出選項範圍`);
      }
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors: [], bank: raw as QuestionBank };
}
