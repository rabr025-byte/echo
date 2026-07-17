// src/components/Menu.tsx
// [Echo] 主選單 v2 — 有主次焦點的多巴胺版
// 主打:標準/AI 生題(大卡片) | 次要:進階/限時/極限/錯題(小按鈕) | AI 幻影獨立強調
import type { QuestionBank } from '../types/bank';
import type { Mode } from '../lib/useGame';
import { loadDaily } from '../lib/daily';

interface Props {
  bank: QuestionBank;
  mistakeCount: number;
  hasApiKey: boolean;
  phantomLoading: boolean;
  streakDays: number;
  onOpenStreak: () => void;
  onStart: (m: Mode) => void;
  onOpenBankPicker: () => void;
  onOpenSettings: () => void;
  onOpenAiGenerate: () => void;
}

// 次要模式(小按鈕橫排)
const SUB_MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'hard', label: '進階', hint: '50 題' },
  { id: 'speed', label: '限時', hint: '衝刺' },
  { id: 'sudden_death', label: '極限', hint: '一錯即死' },
];

export const Menu = ({
  bank, mistakeCount, hasApiKey, phantomLoading, streakDays, onOpenStreak,
  onStart, onOpenBankPicker, onOpenSettings, onOpenAiGenerate,
}: Props) => {
  const daily = loadDaily();
  return (
  <div className="min-h-screen flex flex-col px-5 py-8 max-w-md mx-auto w-full">
    {/* 頂列:題庫切換 + 設定 */}
    <div className="flex justify-between items-center mb-8">
      <button onClick={onOpenBankPicker}
        className="flex items-center gap-1.5 text-fg-dim text-sm tracking-widest active:scale-95 transition-transform">
        <span className="w-1.5 h-1.5 rounded-full bg-accent glow-accent" />
        {bank.displayName}
        <span className="text-fg-dim">⌄</span>
      </button>
      <div className="flex items-center gap-4">
        {streakDays > 0 && (
          <button onClick={onOpenStreak}
            className="flex items-center gap-1 text-sm font-black tabular-nums active:scale-95 transition-transform"
            style={{ color: 'var(--accent)' }}>
            <span className="text-base">🔥</span>{streakDays}
          </button>
        )}
        <button onClick={onOpenSettings}
          className="text-fg-dim text-sm tracking-widest active:scale-95 transition-transform">
          設定
        </button>
      </div>
    </div>

    {/* 標題區(識別) */}
    <div className="mb-8">
      <h1 className="text-5xl font-black tracking-[0.35em] animate-title-glow">ECHO</h1>
      <p className="text-fg-dim text-xs tracking-[0.3em] mt-2">
        {bank.questions.length} 題待挑戰
      </p>
    </div>

    {/* 主打卡片:標準 */}
    <button onClick={() => onStart('normal')}
      className="card-rise w-full p-6 rounded-3xl bg-accent text-accent-fg text-left active:scale-[0.98] transition-transform mb-3 relative overflow-hidden"
      style={{ animationDelay: '0.05s' }}>
      <div className="text-2xl font-black tracking-widest mb-1">開始挑戰</div>
      <div className="text-accent-fg/70 text-sm">隨機 10 題 · 標準模式</div>
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-accent-fg/10" />
    </button>

    {/* 次要模式(橫排三個) */}
    <div className="grid grid-cols-3 gap-3 mb-3">
      {SUB_MODES.map((m, i) => (
        <button key={m.id} onClick={() => onStart(m.id)}
          className="card-rise p-4 rounded-2xl border border-theme-border bg-card active:scale-[0.96] transition-transform"
          style={{ animationDelay: `${0.1 + i * 0.04}s` }}>
          <div className="text-base font-bold tracking-widest">{m.label}</div>
          <div className="text-fg-dim text-[10px] mt-0.5">{m.hint}</div>
        </button>
      ))}
    </div>

    {/* 錯題本 */}
    <button onClick={() => onStart('mistake')} disabled={mistakeCount === 0}
      className="card-rise w-full p-4 rounded-2xl border border-theme-border bg-card active:scale-[0.98] transition-transform mb-6 flex justify-between items-center disabled:opacity-30"
      style={{ animationDelay: '0.22s' }}>
      <span className="text-base font-bold tracking-widest">錯題本</span>
      <span className="text-fg-dim text-xs">
        {mistakeCount > 0 ? `${mistakeCount} 題待複習` : '尚無錯題'}
      </span>
    </button>

    {/* 每日任務 */}
    <div className="card-rise w-full p-4 rounded-2xl border border-theme-border bg-card mb-6"
      style={{ animationDelay: '0.26s' }}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] text-fg-dim tracking-[0.3em] uppercase">今日任務</span>
        {daily.allDone && <span className="text-[10px] font-black" style={{ color: 'var(--good)' }}>✅ 全部完成</span>}
      </div>
      <div className="flex flex-col gap-2">
        {daily.quests.map(q => (
          <div key={q.id} className="flex justify-between items-center text-xs">
            <span className={q.done ? 'line-through opacity-50' : ''}>{q.label}</span>
            <span className="font-mono tabular-nums" style={{ color: q.done ? 'var(--good)' : 'var(--fg-dim)' }}>
              {q.done ? '✓' : `${q.progress}/${q.target}`}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* AI 區(強調,放底部有分隔) */}
    <div className="mt-auto pt-5 border-t border-theme-border flex flex-col gap-3">
      <div className="text-fg-dim text-[10px] tracking-[0.3em] uppercase">AI 功能</div>
      <button onClick={() => onStart('phantom')} disabled={phantomLoading}
        className="w-full p-4 rounded-2xl border border-accent/40 bg-accent/10 active:scale-[0.98] transition-transform text-left flex items-center justify-between disabled:opacity-50">
        <div>
          <div className="text-base font-bold tracking-widest">✦ AI 幻影{phantomLoading && ' · 生成中'}</div>
          <div className="text-fg-dim text-[10px] mt-0.5">
            {hasApiKey ? 'AI 即時出一題考你' : '需先設定 API Key'}
          </div>
        </div>
      </button>
      <button onClick={onOpenAiGenerate}
        className="w-full p-4 rounded-2xl border border-accent/40 bg-accent/10 active:scale-[0.98] transition-transform text-left">
        <div className="text-base font-bold tracking-widest">✦ AI 生成題庫</div>
        <div className="text-fg-dim text-[10px] mt-0.5">貼筆記,變成一整套題目</div>
      </button>
    </div>
  </div>
  );
};
