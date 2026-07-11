// src/components/BankPicker.tsx
// [Echo] 題庫選擇器 — 用預設題庫或上傳自己的 JSON(含驗證)
import { useState } from 'react';
import type { QuestionBank } from '../types/bank';
import { validateBank } from '../lib/validateBank';

interface Props {
  current: QuestionBank;
  onPick: (bank: QuestionBank) => void;
  onClose: () => void;
}

export const BankPicker = ({ current, onPick, onClose }: Props) => {
  const [errors, setErrors] = useState<string[]>([]);

  const handleFile = (file: File) => {
    setErrors([]);
    const reader = new FileReader();
    reader.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(reader.result as string);
      } catch {
        setErrors(['這個檔案不是有效的 JSON 格式']);
        return;
      }
      const result = validateBank(parsed);
      if (!result.ok) { setErrors(result.errors); return; }
      onPick(result.bank!);
    };
    reader.onerror = () => setErrors(['讀取檔案失敗']);
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-sm flex flex-col justify-end">
      <div className="max-w-md mx-auto w-full bg-ink border-t border-parchment/15 rounded-t-3xl p-6 pb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold tracking-widest">選擇題庫</h2>
          <button onClick={onClose} className="text-parchment/40 text-sm">關閉</button>
        </div>

        {/* 目前題庫 */}
        <div className="p-4 rounded-xl border border-parchment/25 bg-parchment/[0.04] mb-4">
          <div className="text-xs text-parchment/40 tracking-widest mb-1">目前使用中</div>
          <div className="font-bold">{current.displayName}</div>
          <div className="text-parchment/40 text-xs mt-1">{current.questions.length} 題</div>
        </div>

        {/* 上傳 */}
        <label className="block w-full p-5 rounded-xl border border-dashed border-parchment/25 text-center cursor-pointer hover:border-parchment/40 transition-colors">
          <input type="file" accept=".json,application/json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div className="text-sm font-bold tracking-widest">上傳題庫檔案</div>
          <div className="text-parchment/40 text-xs mt-1">選擇你自己的 .json 題庫</div>
        </label>

        {errors.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="text-red-400 text-xs font-bold tracking-widest mb-2">題庫有問題,請修正:</div>
            <ul className="text-red-300/80 text-xs space-y-1 max-h-40 overflow-y-auto">
              {errors.slice(0, 10).map((e, i) => <li key={i}>· {e}</li>)}
              {errors.length > 10 && <li>…還有 {errors.length - 10} 個問題</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
