// src/components/BankPicker.tsx
// [Echo] 題庫管理 — 切換已存題庫、上傳新題庫(自動儲存)、刪除題庫
import { useState } from 'react';
import type { QuestionBank } from '../types/bank';
import { validateBank } from '../lib/validateBank';
import { loadBanks, saveBank, deleteBank, storageUsage } from '../lib/bankStore';
import { Trash2, Upload, X, Square, CheckSquare } from 'lucide-react';
import { mergeBanks } from '../lib/composeBank';
import { parseBankJson } from '../lib/parseBankJson';
import { EXAM_PROMPT, LIFE_PROMPT } from './BankGuide';
import '../styles/visual-bank.css';

interface Props {
  current: QuestionBank;
  defaultBank: QuestionBank | null;   // 內建預設題庫(不可刪除)
  onPick: (banks: QuestionBank[]) => void;   // 可回傳多份(複選一起測驗)
  onImportSuccess: (bank: QuestionBank) => void;
  onClose: () => void;
}

export const BankPicker = ({ current, defaultBank, onPick, onImportSuccess, onClose }: Props) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<QuestionBank[]>(loadBanks);
  const [confirmDel, setConfirmDel] = useState<string>('');
  const [picked, setPicked] = useState<Set<string>>(new Set());   // 複選:一起測驗的題庫
  const [pasteText, setPasteText] = useState('');

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

  // 檔案與貼上內容共用同一條:parse → validate → merge → save 管線。
  const importTexts = (items: { label: string; text: string }[], initialErrors: string[] = []) => {
    setErrors([]);
    const okBanks: QuestionBank[] = [];
    const allErrors: string[] = [...initialErrors];

    for (const item of items) {
      const { label, text } = item;
      const pr = parseBankJson(text);
      if (!pr.ok) { allErrors.push(`${label}:${pr.error}`); continue; }
      const parsed = pr.data;

      const rawBanks = Array.isArray(parsed) ? parsed : [parsed];
      // 同一個檔案裡的多份通常是 AI 分批輸出的同一套題,合併成一份
      const validInFile: QuestionBank[] = [];
      rawBanks.forEach((raw, i) => {
        const result = validateBank(raw);
        const prefix = items.length > 1 || rawBanks.length > 1
          ? `${label}${rawBanks.length > 1 ? ` 第 ${i + 1} 份` : ''}:` : '';
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
      const imported = okBanks[0];
      onPick([imported]);
      onImportSuccess(imported);
      if (allErrors.length > 0) {
        setErrors([`已匯入 ${okBanks.length} 份題庫,以下未匯入:`, ...allErrors]);
      }
    } catch (e) {
      setErrors([e instanceof Error ? e.message : '儲存失敗']);
    }
  };

  // 支援一次選取多個檔案;每個檔案可以是單一題庫或多題庫陣列
  const handleFiles = async (files: FileList) => {
    const items: { label: string; text: string }[] = [];
    const readErrors: string[] = [];
    for (const file of Array.from(files)) {
      const text = await file.text().catch(() => null);
      if (text === null) readErrors.push(`${file.name}:讀取失敗`);
      else items.push({ label: file.name, text });
    }
    if (readErrors.length > 0) setErrors(readErrors);
    if (items.length > 0) importTexts(items, readErrors);
    else if (readErrors.length > 0) setErrors(readErrors);
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) {
      setErrors(['請先把 ChatGPT 的完整回覆貼到上面的框裡']);
      return;
    }
    importTexts([{ label: '貼上的內容', text: pasteText }]);
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
      <div className={`bank-row ${isPicked ? 'is-picked' : ''} ${isCurrent ? 'is-current' : ''}`}>
        {/* 勾選:加入本次測驗 */}
        <button onClick={() => togglePick(bank.bankId)}
          className="bank-check active:scale-90 transition-transform"
          aria-label={isPicked ? `取消選取${bank.displayName}` : `選取${bank.displayName}`}>
          <span className="bank-check-box">
            {isPicked ? <CheckSquare size={18} /> : <Square size={18} />}
          </span>
        </button>

        {/* 點名稱 = 直接單獨使用這份 */}
        <button onClick={() => onPick([bank])} className="bank-row-main text-left active:scale-[0.98] transition-transform">
          <span className="bank-row-title">
            <span className="bank-letter" aria-hidden="true">{bank.displayName.slice(0, 1)}</span>
            <span className="bank-name">{bank.displayName}</span>
          </span>
          <span className="bank-row-meta">
            {bank.questions.length} 題
            {bank.questions.some(q => q.type === 'essay') && ' · 含申論'}
            <span className="bank-row-status">{isCurrent ? '目前使用' : '已儲存'}</span>
          </span>
        </button>

        {deletable && (
          <button onClick={() => handleDelete(bank.bankId)}
            className={`bank-delete active:scale-95 transition-all ${pendingDel ? 'is-pending' : ''}`}
            aria-label={pendingDel ? `確定刪除${bank.displayName}` : `刪除${bank.displayName}`}>
            {pendingDel ? <span>確定刪除?</span> : <Trash2 size={15} />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bank-overlay fixed inset-0 z-50 flex flex-col justify-end">
      <div className="bank-sheet max-w-md mx-auto w-full p-5 pb-10 max-h-[88vh] overflow-y-auto safe-bottom">
        <div className="bank-grabber" aria-hidden="true" />
        <div className="bank-header flex justify-between items-start">
          <div>
            <p className="bank-kicker">ECHO / LIBRARY</p>
            <h2 className="bank-heading">題庫管理</h2>
            <p className="bank-subtitle">點一列立即使用；勾選多份可一起測驗</p>
          </div>
          <button onClick={onClose} className="bank-close" aria-label="關閉題庫管理"><X size={20} /></button>
        </div>

        <div className="bank-actions" aria-label="題庫操作">
          <label className="bank-action bank-action-primary active:scale-[0.98] transition-transform">
            <input type="file" accept=".json,application/json" multiple className="hidden"
              onChange={e => { const fs = e.target.files; if (fs && fs.length) handleFiles(fs); }} />
            <Upload size={16} />
            <span><strong>匯入</strong><small>JSON 題庫</small></span>
          </label>
          <label className="bank-action bank-action-secondary active:scale-[0.98] transition-transform">
            <input type="file" accept=".json,application/json" multiple className="hidden"
              onChange={e => { const fs = e.target.files; if (fs && fs.length) handleFiles(fs); }} />
            <span className="bank-plus">＋</span>
            <span><strong>新增題庫</strong><small>從檔案開始</small></span>
          </label>
        </div>

        <section className="bank-ai-card" aria-labelledby="bank-ai-title">
          <div className="bank-ai-head">
            <div>
              <p className="bank-ai-kicker">不用自己寫 JSON</p>
              <h3 id="bank-ai-title">用 ChatGPT 做題庫</h3>
            </div>
            <span className="bank-ai-badge">3 步驟</span>
          </div>
          <ol className="bank-ai-steps">
            <li>
              <span className="bank-step-number">1</span>
              <div><strong>複製指令</strong><small>選一個適合你的版本</small>
                <div className="bank-prompt-buttons">
                  <button type="button" onClick={() => navigator.clipboard?.writeText(EXAM_PROMPT)} className="bank-prompt-button" aria-label="複製學科版 ChatGPT 指令">學科指令</button>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(LIFE_PROMPT)} className="bank-prompt-button" aria-label="複製生活版 ChatGPT 指令">生活指令</button>
                </div>
              </div>
            </li>
            <li><span className="bank-step-number">2</span><div><strong>貼到 ChatGPT</strong><small>再貼上你的筆記、教材或講義</small></div></li>
            <li><span className="bank-step-number">3</span><div><strong>把回覆整段貼回這裡</strong><small>可以直接貼 JSON、```json 圍欄或含註解的回覆</small></div></li>
          </ol>
          <label className="bank-paste-label" htmlFor="bank-paste">ChatGPT 回覆</label>
          <textarea id="bank-paste" value={pasteText} onChange={e => setPasteText(e.target.value)}
            className="bank-paste" rows={7} placeholder="把 ChatGPT 的完整回覆貼在這裡…" />
          <button type="button" onClick={handlePasteImport} className="bank-paste-submit">匯入貼上的題庫</button>
        </section>

        <div className="bank-list">
          {defaultBank && <BankRow bank={defaultBank} deletable={false} />}
          {saved.map(b => <BankRow key={b.bankId} bank={b} deletable />)}
        </div>

        {/* 複選後一起測驗 */}
        {picked.size > 0 && (
          <button onClick={startWithPicked}
            className="bank-picked-cta active:scale-[0.98] transition-transform">
            用選取的 {picked.size} 份題庫一起測驗
            <span>
              共 {allBanks.filter(b => picked.has(b.bankId)).reduce((n, b) => n + b.questions.length, 0)} 題
            </span>
          </button>
        )}

        {errors.length > 0 && (
          <div className="bank-error">
            <div>題庫有問題，請修正：</div>
            <ul>
              {errors.slice(0, 10).map((e, i) => <li key={i}>· {e}</li>)}
              {errors.length > 10 && <li>…還有 {errors.length - 10} 個問題</li>}
            </ul>
          </div>
        )}

        <p className="bank-storage-note">
          已使用約 {storageUsage()} MB(瀏覽器上限約 5 MB)
        </p>
      </div>
    </div>
  );
};
