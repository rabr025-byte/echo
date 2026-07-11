// src/components/Quiz.tsx
// [Echo] 答題畫面 — HP、combo、浮動文字、答對錯回饋
import { useGame } from '../lib/useGame';

interface Props {
  game: ReturnType<typeof useGame>;
  onQuit: () => void;
}

export const Quiz = ({ game, onQuit }: Props) => {
  const { current, currentIdx, questions, selected, answered, hp, combo, points, floats, shake, HP_MAX } = game;
  if (!current) return null;

  const hpPct = Math.max(0, (hp / HP_MAX) * 100);

  return (
    <div className={`min-h-screen max-w-md mx-auto w-full px-5 py-6 flex flex-col ${shake ? 'animate-[shake_0.4s]' : ''}`}>
      {/* 浮動文字層 */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {floats.map(f => (
          <div key={f.id}
            className={`absolute font-black text-xl animate-[floatUp_1s_ease-out_forwards] ${f.kind === 'good' ? 'text-emerald-400' : 'text-red-400'}`}
            style={{ left: f.x, top: f.y }}>
            {f.text}
          </div>
        ))}
      </div>

      {/* 頂部:HP + 退出 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2.5 bg-parchment/10 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${hpPct}%` }} />
        </div>
        <button onClick={onQuit} className="text-parchment/40 text-xs tracking-widest">結束</button>
      </div>

      {/* 進度 + combo + 分數 */}
      <div className="flex justify-between items-center text-xs text-parchment/40 mb-6 tabular-nums">
        <span>{currentIdx + 1} / {questions.length}</span>
        {combo > 1 && <span className="text-amber-400 font-bold">{combo} COMBO</span>}
        <span className="font-mono">{points} 分</span>
      </div>

      {/* 題目 */}
      <div className="mb-6">
        {current.source && <div className="text-parchment/30 text-[10px] mb-2 tracking-wider">{current.source}</div>}
        <p className="text-lg leading-relaxed font-medium">{current.question}</p>
      </div>

      {/* 選項 */}
      <div className="flex flex-col gap-3">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.answer;
          const isPicked = i === selected;
          let cls = 'border-parchment/10 bg-parchment/[0.03]';
          if (answered) {
            if (isCorrect) cls = 'border-emerald-500/60 bg-emerald-500/10';
            else if (isPicked) cls = 'border-red-500/60 bg-red-500/10';
            else cls = 'border-parchment/5 bg-transparent opacity-50';
          }
          return (
            <button key={i} disabled={answered}
              onClick={e => game.answer(i, e.clientX, e.clientY)}
              className={`w-full p-4 rounded-xl border text-left transition-all active:scale-[0.99] ${cls}`}>
              <span className="text-sm leading-relaxed">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* 詳解 + 下一題 */}
      {answered && (
        <div className="mt-6">
          {current.explanation && (
            <div className="p-4 rounded-xl bg-parchment/[0.04] border border-parchment/10 mb-4">
              <div className="text-parchment/40 text-[10px] tracking-widest mb-1">詳解</div>
              <p className="text-sm text-parchment/70 leading-relaxed">{current.explanation}</p>
            </div>
          )}
          <button onClick={game.next}
            className="w-full py-4 rounded-xl bg-parchment text-ink font-bold tracking-widest active:scale-[0.98] transition-all">
            {currentIdx < questions.length - 1 ? '下一題' : '看結果'}
          </button>
        </div>
      )}
    </div>
  );
};
