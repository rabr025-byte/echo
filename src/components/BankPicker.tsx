// src/components/BankPicker.tsx
// [Echo] 題庫管理 — 切換已存題庫、上傳新題庫(自動儲存)、刪除題庫
import { useState } from 'react';
import type { QuestionBank } from '../types/bank';
import { validateBank } from '../lib/validateBank';
import { loadBanks, saveBank, deleteBank, storageUsage } from '../lib/bankStore';
import { Trash2, Upload, X, Check, Square, CheckSquare } from 'lucide-react';
import { mergeBanks } from '../lib/composeBank';

interface Props {
  current: QuestionBank;
  defaultBank: QuestionBank | null;   // 內建預設題庫(不可刪除)
  onPick: (banks: QuestionBank[]) => void;   // 可回傳多份(複選一起測驗)
  onClose: () => void;
}

export const BankPicker = ({ current, defaultBank, onPick, onClose }: Props) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<QuestionBank[]>(loadBanks);
  const [confirmDel, setConfirmDel] = useState<string>('');
  const [picked, setPicked] = useState<Set<string>>(new Set());   // 複選:一起測驗的題庫

  const allBanks = [...(defaultBank ? [defaultBank] : []), ...saved];
  const togglePick = (bankId: string) =>
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(bankId)) next.delete(bankId); else next.add(bankId);
      return next;
    });
  const startWithPicked = () => {
    const chosen = allBanks.filter(b => picked.has(b.bankId));
    if (chosen.length > 0) onPick(chosen);
  };

  // 支援一次選取多個檔案;每個檔案可以是單一題庫或多題庫陣列
  const handleFiles = async (files: FileList) => {
    setErrors([]);
    const okBanks: QuestionBank[] = [];
    const allErrors: string[] = [];

    for (const file of Array.from(files)) {
      const text = await file.text().catch(() => null);
      if (text === null) { allErrors.push(`${file.name}:讀取失敗`); continue; }

      let parsed: unknown;
      try { parsed = JSON.parse(text); }
      catch {
        allErrors.push(`${file.name}:JSON 格式錯誤(若是自己合併多批內容,常見原因是少了逗號或中括號。建議不要手動合併,直接一次選取多個檔案上傳)`);
        continue;
      }

      const rawBanks = Array.isArray(parsed) ? parsed : [parsed];
      // 同一個檔案裡的多份通常是 AI 分批輸出的同一套題,合併成一份
      const validInFile: QuestionBank[] = [];
      rawBanks.forEach((raw, i) => {
        const result = validateBank(raw);
        const prefix = files.length > 1 || rawBanks.length > 1
          ? `${file.name}${rawBanks.length > 1 ? ` 第 ${i + 1} 份` : ''}:` : '';
        if (result.ok) validInFile.push(result.bank!);
        else result.errors.forEach(e => allErrors.push(prefix + e));
      });
      if (validInFile.length > 0) okBanks.push(mergeBanks(validInFile));
    }

    if (okBanks.length === 0) {
      setErrors(allErrors.length ? allErrors : ['沒有找到可用的題庫']);
      return;
    }

    try {
      let list = saved;
      okBanks.forEach(b => { list = saveBank(b); });
      setSaved(list);
      if (allErrors.length > 0) {
        setErrors([`已匯入 ${okBanks.length} 份題庫,以下未匯入:`, ...allErrors]);
      }
      onPick([okBanks[0]]);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : '儲存失敗']);
    }
  };

  const handleDelete = (bankId: string) => {
    if (confirmDel !== bankId) { setConfirmDel(bankId); setTimeout(() => setConfirmDel(''), 3000); return; }
    const list = deleteBank(bankId);
    setSaved(list);
    setConfirmDel('');
    // 刪掉的正是使用中的 → 切回預設題庫
    if (current.bankId === bankId && defaultBank) onPick([defaultBank]);
  };

  const BankRow = ({ bank, deletable }: { bank: QuestionBank; deletable: boolean }) => {
    const isCurrent = bank.bankId === current.bankId;
    const isPicked = picked.has(bank.bankId);
    const pendingDel = confirmDel === bank.bankId;
    return (
      <div className={`p-3 rounded-xl border flex items-center gap-2 ${
        isPicked ? 'border-accent/50 bg-accent/10'
        : isCurrent ? 'border-accent/30 bg-card' : 'border-theme-border bg-card'
      }`}>
        {/* 勾選:加入本次測驗 */}
        <button onClick={() => togglePick(bank.bankId)}
          className="p-1 active:scale-90 transition-transform"
          style={{ color: isPicked ? 'var(--accent)' : 'var(--fg-dim)' }}>
          {isPicked ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>

        {/* 點名稱 = 直接單獨使用這份 */}
        <button onClick={() => onPick([bank])} className="flex-1 text-left active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-1.5">
            {isCurrent && <Check size={13} style={{ color: 'var(--accent)' }} />}
            <span className="font-bold text-sm">{bank.displayName}</span>
          </div>
          <div className="text-fg-dim text-[10px] mt-0.5">
            {bank.questions.length} 題
            {bank.questions.some(q => q.type === 'essay') && ' · 含申論'}
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
          <div>
            <h2 className="text-lg font-bold tracking-widest">題庫</h2>
            <p className="text-fg-dim text-[10px] mt-0.5">點名稱單獨使用 · 勾選多份可一起測驗</p>
          </div>
          <button onClick={onClose} className="text-fg-dim"><X size={20} /></button>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {defaultBank && <BankRow bank={defaultBank} deletable={false} />}
          {saved.map(b => <BankRow key={b.bankId} bank={b} deletable />)}
        </div>

        {/* 複選後一起測驗 */}
        {picked.size > 0 && (
          <button onClick={startWithPicked}
            className="w-full py-3.5 mb-4 rounded-xl bg-accent text-accent-fg font-bold tracking-widest active:scale-[0.98] transition-transform">
            用選取的 {picked.size} 份題庫一起測驗
            <span className="block text-[10px] font-normal opacity-70 mt-0.5">
              共 {allBanks.filter(b => picked.has(b.bankId)).reduce((n, b) => n + b.questions.length, 0)} 題
            </span>
          </button>
        )}

        <label className="block w-full p-5 rounded-xl border border-dashed border-theme-border text-center cursor-pointer active:scale-[0.98] transition-transform">
          <input type="file" accept=".json,application/json" multiple className="hidden"
            onChange={e => { const fs = e.target.files; if (fs && fs.length) handleFiles(fs); }} />
          <div className="flex items-center justify-center gap-2 text-sm font-bold tracking-widest">
            <Upload size={15} /> 上傳題庫檔案
          </div>
          <div className="text-fg-dim text-[10px] mt-1">可一次選多個檔案 · 上傳後自動儲存,下次開啟仍在</div>
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
