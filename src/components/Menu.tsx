// src/components/Menu.tsx
// [Echo] 主選單 — arcade cabinet × editorial calm
// 主打:標準挑戰 | 次要:模式與複習列 | AI 功能採輕量導覽列
import type { QuestionBank } from '../types/bank';
import type { Mode } from '../lib/useGame';
import { loadDaily } from '../lib/daily';
import {
  Flame, PenLine, Sparkles, ChevronDown, CheckCircle2, BarChart3,
  ArrowUpRight, BookOpen, Clock3, Crosshair, Skull,
} from 'lucide-react';

interface Props {
  bank: QuestionBank;
  mistakeCount: number;
  hasApiKey: boolean;
  phantomLoading: boolean;
  streakDays: number;
  onOpenStreak: () => void;
  essayCount: number;
  onOpenStats: () => void;
  quizCount: number;
  onChangeQuizCount: (n: number) => void;
  onStart: (m: Mode) => void;
  onOpenBankPicker: () => void;
  onOpenSettings: () => void;
  onOpenAiGenerate: () => void;
}

// 次要模式維持輕量資訊列，讓標準模式保留唯一主焦點。
const SUB_MODES: { id: Mode; label: string; hint: string; icon: typeof BookOpen }[] = [
  { id: 'hard', label: '進階', hint: '50 題', icon: Crosshair },
  { id: 'speed', label: '限時', hint: '衝刺', icon: Clock3 },
  { id: 'sudden_death', label: '極限', hint: '一錯即終', icon: Skull },
];

export const Menu = ({
  bank, mistakeCount, hasApiKey, phantomLoading, streakDays, onOpenStreak, essayCount, onOpenStats, quizCount, onChangeQuizCount,
  onStart, onOpenBankPicker, onOpenSettings, onOpenAiGenerate,
}: Props) => {
  const daily = loadDaily();
  return (
  <div className="menu-shell min-h-screen flex flex-col px-5 pb-8 max-w-md mx-auto w-full safe-top">
    {/* 頂列:題庫切換 + 設定 */}
    <div className="menu-topbar flex justify-between items-center mb-8">
      <button onClick={onOpenBankPicker} data-tour="bank"
        className="flex items-center gap-1.5 text-fg-dim text-sm tracking-widest active:scale-95 transition-transform">
        <span className="w-1.5 h-1.5 rounded-full bg-accent glow-accent" />
        {bank.displayName}
        <ChevronDown size={14} className="text-fg-dim" />
      </button>
      <div className="flex items-center gap-4">
        {streakDays > 0 && (
          <button onClick={onOpenStreak}
            className="flex items-center gap-1 text-sm font-black tabular-nums active:scale-95 transition-transform"
            style={{ color: 'var(--accent)' }}>
            <Flame size={16} fill="currentColor" />{streakDays}
          </button>
        )}
        <button onClick={onOpenStats}
          className="text-fg-dim active:scale-95 transition-transform">
          <BarChart3 size={17} />
        </button>
        <button onClick={onOpenSettings}
          className="text-fg-dim text-sm tracking-widest active:scale-95 transition-transform">
          設定
        </button>
      </div>
    </div>

    {/* 標題區(識別) */}
    <div className="menu-hero mb-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="menu-wordmark text-5xl font-black">ECHO</h1>
        <div className="menu-question-count text-right">
          <span className="text-fg-dim text-[10px] tracking-[0.24em] block">題庫容量</span>
          <span className="text-sm font-bold tabular-nums">{bank.questions.length} 題</span>
        </div>
      </div>
      <svg className="menu-ripple" viewBox="0 0 94 18" aria-hidden="true">
        <path d="M1 9h24M35 9h12M58 9h35" />
        <path d="M27 3c3 3 3 9 0 12M51 3c3 3 3 9 0 12M57 3c3 3 3 9 0 12" />
      </svg>
      {bank.bankId === 'echo-sample-default' && (
        <button onClick={onOpenBankPicker}
          className="menu-bank-notice mt-4 text-[11px] leading-relaxed text-left active:scale-[0.99] transition-transform">
          <span style={{ color: 'var(--accent)' }} className="font-bold">範例題庫</span>
          <span className="text-fg-dim"> · 點此換上你自己的題目</span>
          <ArrowUpRight size={13} aria-hidden="true" />
        </button>
      )}
    </div>

    {/* 主打卡片:標準 */}
    <button onClick={() => onStart('normal')} data-tour="start"
      className="menu-hero-cta card-rise w-full p-6 rounded-3xl bg-accent text-accent-fg text-left active:scale-[0.98] transition-transform mb-3 relative overflow-hidden"
      style={{ animationDelay: '0.05s' }}>
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-black tracking-widest mb-1">開始挑戰</div>
          <div className="text-accent-fg/70 text-sm">
            隨機 {quizCount === 0 ? '全部' : quizCount} 題 · 標準模式
          </div>
        </div>
        <ArrowUpRight size={22} strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div className="menu-hero-orbit absolute -right-5 -bottom-8 w-32 h-32 rounded-full" />
    </button>

    {/* 題數選擇(套用標準模式) */}
    <div className="menu-count-picker card-rise flex items-center gap-2 mb-6 overflow-x-auto" style={{ animationDelay: '0.08s' }}>
      <span className="text-fg-dim text-[10px] tracking-widest shrink-0">每局</span>
      {[10, 25, 50, 100, 0].map(n => (
        <button key={n} onClick={() => onChangeQuizCount(n)}
          className={`menu-count-option shrink-0 px-3 py-1.5 rounded-full border text-[11px] font-bold tabular-nums transition-transform active:scale-95 ${
            quizCount === n ? 'border-accent/50 bg-accent/10' : 'border-theme-border text-fg-dim'
          }`}
          style={quizCount === n ? { color: 'var(--accent)' } : undefined}>
          {n === 0 ? '全部' : n}
        </button>
      ))}
    </div>

    {/* 次要模式(橫排三個) */}
    <div className="menu-mode-grid grid grid-cols-3 gap-2 mb-3" data-tour="modes">
      {SUB_MODES.map((m, i) => (
        <button key={m.id} onClick={() => onStart(m.id)}
          className="menu-mode-tile card-rise p-3 rounded-2xl border border-theme-border bg-card text-left active:scale-[0.97] transition-transform"
          style={{ animationDelay: `${0.1 + i * 0.04}s` }}>
          <m.icon size={16} strokeWidth={1.8} className="text-fg-dim mb-3" aria-hidden="true" />
          <div className="text-sm font-bold tracking-widest">{m.label}</div>
          <div className="text-fg-dim text-[10px] mt-1">{m.hint}</div>
        </button>
      ))}
    </div>

    {/* 錯題本 */}
    <button onClick={() => onStart('mistake')} disabled={mistakeCount === 0}
      className="menu-secondary-row card-rise w-full p-4 rounded-2xl border border-theme-border bg-card active:scale-[0.99] transition-transform mb-6 flex justify-between items-center disabled:opacity-30"
      style={{ animationDelay: '0.22s' }}>
      <span className="text-sm font-bold tracking-widest flex items-center gap-2"><BookOpen size={16} className="text-fg-dim" />錯題本</span>
      <span className="text-fg-dim text-xs">
        {mistakeCount > 0 ? `${mistakeCount} 題待複習` : '尚無錯題'}
      </span>
    </button>

    {/* 申論挑戰(題庫有申論題才出現) */}
    {essayCount > 0 && (
      <button onClick={() => onStart('essay')}
        className="menu-secondary-row card-rise w-full p-4 rounded-2xl border border-theme-border bg-card active:scale-[0.99] transition-transform mb-3 flex justify-between items-center"
        style={{ animationDelay: '0.24s' }}>
        <span className="text-sm font-bold tracking-widest flex items-center gap-2"><PenLine size={16} className="text-fg-dim" />申論挑戰</span>
        <span className="text-fg-dim text-xs">{essayCount} 題 · AI 評分</span>
      </button>
    )}

    {/* 每日任務 */}
    <div className="menu-daily card-rise w-full p-4 rounded-2xl border border-theme-border bg-card mb-6"
      data-tour="daily"
      style={{ animationDelay: '0.26s' }}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] text-fg-dim tracking-[0.3em] uppercase">今日任務</span>
        {daily.allDone && <span className="text-[10px] font-black flex items-center gap-1" style={{ color: 'var(--good)' }}><CheckCircle2 size={12} /> 全部完成</span>}
      </div>
      <div className="flex flex-col gap-3">
        {daily.quests.map(q => (
          <div key={q.id} className="menu-quest text-xs">
            <div className="flex justify-between items-center gap-3">
              <span className={q.done ? 'line-through opacity-50' : ''}>{q.label}</span>
              <span className="text-fg-dim font-mono tabular-nums text-[10px]">{q.done ? '完成' : `${q.progress}/${q.target}`}</span>
            </div>
            <div className="menu-progress-track mt-1.5" aria-hidden="true">
              <div className="menu-progress-fill" style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%`, backgroundColor: q.done ? 'var(--good)' : 'var(--accent)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* AI 區(強調,放底部有分隔) */}
    <div className="menu-ai mt-auto pt-5 border-t border-theme-border flex flex-col" data-tour="ai">
      <div className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-2">AI 功能</div>
      <button onClick={() => onStart('phantom')} disabled={phantomLoading}
        className="menu-ai-row w-full py-3 border-b border-theme-border active:scale-[0.99] transition-transform text-left flex items-center justify-between disabled:opacity-50">
        <div className="flex items-center gap-3">
          <Sparkles size={17} className="text-accent" aria-hidden="true" />
          <div>
            <div className="text-sm font-bold tracking-widest">AI 幻影{phantomLoading && ' · 生成中'}</div>
            <div className="text-fg-dim text-[10px] mt-0.5">
            {hasApiKey ? 'AI 即時出一題考你' : '需先設定 API Key'}
            </div>
          </div>
        </div>
        <ChevronDown size={15} className="-rotate-90 text-fg-dim" aria-hidden="true" />
      </button>
      <button onClick={onOpenAiGenerate}
        className="menu-ai-row w-full py-3 active:scale-[0.99] transition-transform text-left flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={17} className="text-accent" aria-hidden="true" />
          <div>
            <div className="text-sm font-bold tracking-widest">AI 生成題庫</div>
            <div className="text-fg-dim text-[10px] mt-0.5">貼筆記，變成一整套題目</div>
          </div>
        </div>
        <ChevronDown size={15} className="-rotate-90 text-fg-dim" aria-hidden="true" />
      </button>
    </div>
  </div>
  );
};
