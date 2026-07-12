// src/components/Menu.tsx
// [Echo] 主選單 — 選模式、篩選、進入遊戲
import type { QuestionBank } from '../types/bank';
import type { Mode } from '../lib/useGame';

interface Props {
  bank: QuestionBank;
  mistakeCount: number;
  hasApiKey: boolean;
  phantomLoading: boolean;
  onStart: (m: Mode) => void;
  onOpenBankPicker: () => void;
  onOpenSettings: () => void;
  onOpenAiGenerate: () => void;
}

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: 'normal', label: '標準', desc: '隨機 10 題' },
  { id: 'hard', label: '進階', desc: '隨機 50 題' },
  { id: 'speed', label: '限時', desc: '全部題目 · 答對自動跳' },
  { id: 'sudden_death', label: '極限', desc: '答錯即結束' },
];

export const Menu = ({ bank, mistakeCount, hasApiKey, phantomLoading, onStart, onOpenBankPicker, onOpenSettings, onOpenAiGenerate }: Props) => (
  <div className="min-h-screen flex flex-col items-center px-6 py-12 max-w-md mx-auto w-full">
    <div className="w-full flex justify-end mb-2">
      <button onClick={onOpenSettings}
        className="text-fg-dim text-sm tracking-widest hover:text-fg/70 transition-colors">
        設定
      </button>
    </div>
    <div className="text-center mb-2">
      <h1 className="text-3xl font-black tracking-[0.3em]">Echo</h1>
      <button onClick={onOpenBankPicker}
        className="mt-2 text-fg-dim text-sm tracking-widest hover:text-fg/80 transition-colors">
        {bank.displayName} · {bank.questions.length} 題 ⌄
      </button>
    </div>

    <div className="w-full flex flex-col gap-3 mt-8">
      {MODES.map(m => (
        <button key={m.id} onClick={() => onStart(m.id)}
          className="w-full p-5 rounded-2xl border border-theme-border bg-card active:scale-[0.98] transition-all text-left hover:border-theme-border">
          <div className="text-lg font-bold tracking-widest">{m.label}</div>
          <div className="text-fg-dim text-xs mt-1">{m.desc}</div>
        </button>
      ))}

      <button onClick={() => onStart('mistake')} disabled={mistakeCount === 0}
        className="w-full p-5 rounded-2xl border border-theme-border bg-card active:scale-[0.98] transition-all text-left disabled:opacity-30 hover:border-theme-border">
        <div className="text-lg font-bold tracking-widest">錯題本</div>
        <div className="text-fg-dim text-xs mt-1">
          {mistakeCount > 0 ? `${mistakeCount} 題待複習` : '目前沒有錯題'}
        </div>
      </button>

      {/* AI 功能 */}
      <div className="mt-2 pt-4 border-t border-theme-border flex flex-col gap-3">
        <button onClick={() => onStart('phantom')} disabled={phantomLoading}
          className="w-full p-5 rounded-2xl border border-theme-border bg-card active:scale-[0.98] transition-all text-left disabled:opacity-50">
          <div className="text-lg font-bold tracking-widest">✦ AI 幻影{phantomLoading && ' · 生成中…'}</div>
          <div className="text-fg-dim text-xs mt-1">
            {hasApiKey ? 'AI 即時出一題新的考你' : '需先在設定填 API Key'}
          </div>
        </button>

        <button onClick={onOpenAiGenerate}
          className="w-full p-5 rounded-2xl border border-theme-border bg-card active:scale-[0.98] transition-all text-left">
          <div className="text-lg font-bold tracking-widest">✦ AI 生成題庫</div>
          <div className="text-fg-dim text-xs mt-1">貼筆記,AI 幫你變成一整套題目</div>
        </button>
      </div>
    </div>
  </div>
);
