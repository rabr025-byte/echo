// src/App.tsx
// [Echo] v0.1 骨架版
// 第一階段:能跑起來、載入題庫、顯示題數 — 驗證環境正常

import { useEffect, useState } from 'react';
import type { QuestionBank } from './types/bank';

export const App = () => {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [error, setError] = useState('');

  // 載入預設題庫(之後第二階段會換成「題庫選擇器」)
  useEffect(() => {
    fetch('/banks/ipas_bank.json')
      .then(r => {
        if (!r.ok) throw new Error(`載入失敗 (${r.status})`);
        return r.json();
      })
      .then((data: QuestionBank) => setBank(data))
      .catch(e => setError(e.message));
  }, []);

  // 動態標題:Echo · {題庫名}
  const title = bank ? `Echo · ${bank.displayName}` : 'Echo';
  useEffect(() => { document.title = title; }, [title]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-black tracking-[0.3em]">
        Echo{bank && <span className="text-parchment/40 font-normal text-2xl"> · {bank.displayName}</span>}
      </h1>

      {error && (
        <p className="text-red-400 text-sm">題庫載入失敗:{error}</p>
      )}

      {bank && (
        <div className="text-center space-y-2">
          <p className="text-parchment/60 text-sm">{bank.name}</p>
          <p className="text-2xl font-mono font-bold">{bank.questions.length} 題已就緒</p>
          <p className="text-parchment/40 text-xs">{bank.description}</p>
        </div>
      )}

      {!bank && !error && (
        <p className="text-parchment/40 text-sm animate-pulse">載入題庫中…</p>
      )}

      <p className="text-parchment/20 text-[10px] tracking-widest mt-8">
        v0.1 骨架版 · 環境驗證用
      </p>
    </div>
  );
};
