// src/lib/composeBank.ts
// [Echo] 題庫合併與組合
// mergeBanks:同一檔案裡的多份(AI 分批產物)→ 合併成一份,並去重
// composeBanks:使用者複選多份題庫 → 組出臨時的「組合題庫」一起測驗(不動原檔)

import type { QuestionBank, Question } from '../types/bank';

// 題目文字正規化,用於比對重複
const normText = (t: string) =>
  t.replace(/\s+/g, '').replace(/[，,。.、？?！!（）()「」『』:：;；]/g, '');

// 去掉「Part 1」「(1/5)」「-續」這類分批標記,還原乾淨名稱
const stripPartMark = (s: string) =>
  s.replace(/[\s\-_]*(part|Part|PART)[\s\-_]*\d+/g, '')
   .replace(/[\s\-_]*\(\s*\d+\s*\/\s*\d+\s*\)/g, '')
   .replace(/[\s\-_]*第?\s*[一二三四五六七八九十\d]+\s*(部分|部份)/g, '')
   .replace(/[\s\-_]*(續|final|Final|FINAL|最終部分)/g, '')
   .replace(/[\s\-_]+$/, '')
   .trim();

/**
 * 合併多份題庫成一份(用於單一檔案內含多份的情況)
 * - 依題目文字去重
 * - id 衝突時自動加序號
 */
export function mergeBanks(banks: QuestionBank[]): QuestionBank {
  if (banks.length === 1) return banks[0];

  const first = banks[0];
  const seenText = new Set<string>();
  const seenId = new Set<string>();
  const questions: Question[] = [];
  let dupCount = 0;

  banks.forEach(b => {
    b.questions.forEach(q => {
      const key = normText(q.question);
      if (seenText.has(key)) { dupCount++; return; }   // 重複題直接略過
      seenText.add(key);

      let id = q.id;
      if (seenId.has(id)) {                            // id 撞號補序號
        let n = 2;
        while (seenId.has(`${id}-${n}`)) n++;
        id = `${id}-${n}`;
      }
      seenId.add(id);
      questions.push({ ...q, id });
    });
  });

  return {
    bankId: stripPartMark(first.bankId) || first.bankId,
    displayName: stripPartMark(first.displayName) || first.displayName,
    name: stripPartMark(first.name) || first.name,
    author: first.author,
    description: `合併 ${banks.length} 份批次,共 ${questions.length} 題`
      + (dupCount > 0 ? `(已去除 ${dupCount} 題重複)` : ''),
    questions,
  };
}

/**
 * 把複選的多份題庫組成一份臨時題庫(原題庫不動)
 * 每題標記來源,讓答題統計能寫回原本的題庫
 */
export function composeBanks(banks: QuestionBank[]): QuestionBank {
  if (banks.length === 1) return banks[0];

  const sortedIds = banks.map(b => b.bankId).sort();
  const questions: Question[] = banks.flatMap(b =>
    b.questions.map(q => ({
      ...q,
      id: `${b.bankId}::${q.id}`,      // 組合內的唯一 id,避免跨題庫撞號
      sourceBankId: b.bankId,          // 來源題庫(統計寫回用)
      sourceQuestionId: q.id,          // 原本的題目 id
    }))
  );

  const names = banks.map(b => b.displayName);
  const label = names.length <= 2 ? names.join(' + ') : `${names[0]} 等 ${names.length} 份`;

  return {
    bankId: `multi:${sortedIds.join('+')}`,   // 組合的專屬識別(場次紀錄、幽靈用)
    displayName: label,
    name: names.join(' + '),
    description: `${banks.length} 份題庫組合,共 ${questions.length} 題`,
    questions,
  };
}
