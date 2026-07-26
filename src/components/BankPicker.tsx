// src/components/BankPicker.tsx
// [Echo] 題庫管理 — 切換已存題庫、上傳新題庫(自動儲存)、刪除題庫
import { useState } from 'react';
import type { QuestionBank } from '../types/bank';
import { validateBank } from '../lib/validateBank';
import { loadBanks, saveBank, deleteBank, storageUsage } from '../lib/bankStore';
import { Trash2, Upload, X, Check } from 'lucide-react';

interface Props {
  current: QuestionBank;
  defaultBank: QuestionBank | null;   // 內建預設題庫(不可刪除)
  onPick: (bank: QuestionBank) => void;
  onClose: () => void;
}

export const BankPicker = ({ current, defaultBank, onPick, onClose }: Props) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<QuestionBank[]>(loadBanks);
  const [confirmDel, setConfirmDel] = useState<string>('');

  const handleFile = (file: File) => {
    setErrors([]);
    const reader = new FileReader();
    reader.onload = () => {
      let parsed: unknown;
      try { parsed = JSON.parse(reader.result as string); }
      catch { setErrors(['這個檔案不是有效的 JSON 格式']); return; }

      const result = validateBank(parsed);
      if (!result.ok) { setErrors(result.errors); return; }

      try {
        const list = saveBank(result.bank!);   // 存進 localStorage,重開仍在
        setSaved(list);
        onPick(result.bank!);
      } catch (e) {
        setErrors([e instanceof Error ? e.message : '儲存失敗']);
      }
    };
    reader.onerror = () => setErrors(['讀取檔案失敗']);
    reader.readAsText(file);
  };

  const handleDelete = (bankId: string) => {
    if (confirmDel !== bankId) { setConfirmDel(bankId); setTimeout(() => setConfirmDel(''), 3000); return; }
    const list = deleteBank(bankId);
    setSaved(list);
    setConfirmDel('');
    // 刪掉的正是使用中的 → 切回預設題庫
    if (current.bankId === bankId && defaultBank) onPick(defaultBank);
  };

  const BankRow = ({ bank, deletable }: { bank: QuestionBank; deletable: boolean }) => {
    const isCurrent = bank.bankId === current.bankId;
    const pendingDel = confirmDel === bank.bankId;
    return (
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
        isCurrent ? 'border-accent/50 bg-accent/10' : 'border-theme-border bg-card'
      }`}>
        <button onClick={() => onPick(bank)} className="flex-1 text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2">
            {isCurrent && <Check size={14} style={{ color: 'var(--accent)' }} />}
            <span className="font-bold text-sm">{bank.displayName}</span>
          </div>
          <div className="text-fg-dim text-[10px] mt-0.5">
            {bank.questions.length} 題
            {bank.questions.some(q => q.type === 'essay') && ' · 含申論'}
            {bank.author && ` · ${bank.author}`}
          </div>
        </button>
        {deletable && (
          <button onClick={() => handleDelete(bank.bankId)}
            className={`p-2 rounded-lg active:scale-95 transition-all ${pendingDel ? 'bg-bad/20' : ''}`}
            style={{ color: pendingDel ? 'var(--bad)' : 'var(--fg-dim)' }}>
            {pendingDel ? <span className="text-[10px] font-bold px-1">確定刪除?</span> : <Trash2 size={15} />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col justify-end">
      <div className="max-w-md mx-auto w-full bg-bg border-t border-theme-border rounded-t-3xl p-6 pb-12 max-h-[85vh] overflow-y-auto safe-bottom">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold tracking-widest">題庫</h2>
          <button onClick={onClose} className="text-fg-dim"><X size={20} /></button>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {defaultBank && <BankRow bank={defaultBank} deletable={false} />}
          {saved.map(b => <BankRow key={b.bankId} bank={b} deletable />)}
        </div>

        <label className="block w-full p-5 rounded-xl border border-dashed border-theme-border text-center cursor-pointer active:scale-[0.98] transition-transform">
          <input type="file" accept=".json,application/json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div className="flex items-center justify-center gap-2 text-sm font-bold tracking-widest">
            <Upload size={15} /> 上傳題庫檔案
          </div>
          <div className="text-fg-dim text-[10px] mt-1">上傳後會自動儲存,下次開啟仍在</div>
        </label>

        {errors.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-bad/10 border border-bad/30">
            <div className="text-bad text-xs font-bold tracking-widest mb-2">題庫有問題,請修正:</div>
            <ul className="text-bad text-xs space-y-1 max-h-40 overflow-y-auto opacity-90">
              {errors.slice(0, 10).map((e, i) => <li key={i}>· {e}</li>)}
              {errors.length > 10 && <li>…還有 {errors.length - 10} 個問題</li>}
            </ul>
          </div>
        )}

        <p className="text-fg-dim text-[10px] text-center mt-4">
          已使用約 {storageUsage()} MB(瀏覽器上限約 5 MB)
        </p>
      </div>
    </div>
  );
};
