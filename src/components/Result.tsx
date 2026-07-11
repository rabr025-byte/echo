// src/components/Result.tsx
// [Echo] 結算畫面
import { useGame } from '../lib/useGame';

interface Props {
  game: ReturnType<typeof useGame>;
  onReplay: () => void;
  onMenu: () => void;
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export const Result = ({ game, onReplay, onMenu }: Props) => {
  const { score, questions, points, timer, hp } = game;
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const survived = hp > 0;

  return (
    <div className="min-h-screen max-w-md mx-auto w-full px-6 py-12 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="text-parchment/40 text-xs tracking-[0.3em] uppercase mb-2">
          {survived ? '完成' : '陣亡'}
        </div>
        <div className="text-6xl font-black tabular-nums">{pct}<span className="text-2xl">%</span></div>
        <div className="text-parchment/50 text-sm mt-2">答對 {score} / {total} 題</div>
      </div>

      <div className="w-full grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-parchment/[0.04] border border-parchment/10 text-center">
          <div className="text-parchment/40 text-[10px] tracking-widest mb-1">得分</div>
          <div className="text-xl font-mono font-bold">{points}</div>
        </div>
        <div className="p-4 rounded-xl bg-parchment/[0.04] border border-parchment/10 text-center">
          <div className="text-parchment/40 text-[10px] tracking-widest mb-1">用時</div>
          <div className="text-xl font-mono font-bold">{fmtTime(timer)}</div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3">
        <button onClick={onReplay}
          className="w-full py-4 rounded-xl bg-parchment text-ink font-bold tracking-widest active:scale-[0.98] transition-all">
          再來一次
        </button>
        <button onClick={onMenu}
          className="w-full py-4 rounded-xl border border-parchment/15 text-parchment/70 font-bold tracking-widest active:scale-[0.98] transition-all">
          回選單
        </button>
      </div>
    </div>
  );
};
