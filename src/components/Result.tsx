// src/components/Result.tsx
// [Echo] 結算 v2 — 依成績分級慶祝
import { useGame } from '../lib/useGame';
import { useEffect, useState } from 'react';

interface Props {
  game: ReturnType<typeof useGame>;
  onReplay: () => void;
  onMenu: () => void;
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// 成績分級
function grade(pct: number, survived: boolean) {
  if (!survived) return { tier: 'fail', label: '陣亡', celebrate: 0 };
  if (pct === 100) return { tier: 'perfect', label: '完美', celebrate: 3 };
  if (pct >= 80) return { tier: 'great', label: '優異', celebrate: 2 };
  if (pct >= 60) return { tier: 'good', label: '通過', celebrate: 1 };
  return { tier: 'ok', label: '完成', celebrate: 0 };
}

interface Particle { id: number; dx: number; dy: number; delay: number; }

export const Result = ({ game, onReplay, onMenu }: Props) => {
  const { score, questions, points, timer, hp } = game;
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const survived = hp > 0;
  const g = grade(pct, survived);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    if (g.celebrate > 0) {
      const count = g.celebrate * 12;
      const ps = Array.from({ length: count }, (_, i) => ({
        id: i,
        dx: (Math.random() - 0.5) * 400,
        dy: -100 - Math.random() * 300,
        delay: Math.random() * 0.3,
      }));
      setParticles(ps);
    }
  }, [g.celebrate]);

  return (
    <div className="min-h-screen max-w-md mx-auto w-full px-6 py-12 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
      {/* 慶祝粒子(從底部往上噴) */}
      <div className="fixed inset-0 pointer-events-none flex items-end justify-center pb-20">
        {particles.map(p => (
          <div key={p.id} className="absolute w-2.5 h-2.5 rounded-full animate-particle"
            style={{ background: 'var(--accent)', '--dx': `${p.dx}px`, '--dy': `${p.dy}px`,
              animationDelay: `${p.delay}s`, animationDuration: '1.2s' } as React.CSSProperties} />
        ))}
      </div>

      <div className={`text-center transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-fg-dim text-xs tracking-[0.3em] uppercase mb-3">{g.label}</div>
        <div className={`text-7xl font-black tabular-nums ${g.celebrate >= 2 ? 'animate-pop' : ''}`}
          style={{ color: g.celebrate > 0 ? 'var(--accent)' : 'var(--fg)',
            textShadow: g.celebrate >= 2 ? '0 0 30px color-mix(in srgb, var(--accent) 60%, transparent)' : 'none' }}>
          {pct}<span className="text-3xl">%</span>
        </div>
        <div className="text-fg-dim text-sm mt-2">答對 {score} / {total} 題</div>
      </div>

      <div className="w-full grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-card border border-theme-border text-center">
          <div className="text-fg-dim text-[10px] tracking-widest mb-1">得分</div>
          <div className="text-xl font-mono font-bold">{points}</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-theme-border text-center">
          <div className="text-fg-dim text-[10px] tracking-widest mb-1">用時</div>
          <div className="text-xl font-mono font-bold">{fmtTime(timer)}</div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3">
        <button onClick={onReplay}
          className="w-full py-4 rounded-xl bg-accent text-accent-fg font-bold tracking-widest active:scale-[0.98] transition-all">
          再來一次
        </button>
        <button onClick={onMenu}
          className="w-full py-4 rounded-xl border border-theme-border text-fg/70 font-bold tracking-widest active:scale-[0.98] transition-all">
          回選單
        </button>
      </div>
    </div>
  );
};
