// src/components/Result.tsx
// [Echo] 結算 v2 — 依成績分級慶祝
import { useGame } from '../lib/useGame';
import { useEffect, useState } from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';

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
  const { score, questions, points, timer, hp, newRecord, dailyAllDone } = game;
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
    <div className="result-shell min-h-screen max-w-md mx-auto w-full px-5 pb-10 flex flex-col items-center justify-center relative overflow-hidden safe-top">
      {/* 慶祝粒子(從底部往上噴) */}
      <div className="fixed inset-0 pointer-events-none flex items-end justify-center pb-20">
        {particles.map(p => (
          <div key={p.id} className="absolute result-particle rounded-full animate-particle"
            style={{ background: 'var(--accent)', '--dx': `${p.dx}px`, '--dy': `${p.dy}px`,
              animationDelay: `${p.delay}s`, animationDuration: '1.2s' } as React.CSSProperties} />
        ))}
      </div>

      <div className={`result-hero text-center transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="result-kicker">本局結算 · {g.label}</div>
        <div className={`result-score ${g.celebrate >= 2 ? 'animate-pop' : ''}`}
          style={{ color: g.celebrate > 0 ? 'var(--accent)' : 'var(--fg)',
            textShadow: g.celebrate >= 2 ? '0 0 30px color-mix(in srgb, var(--accent) 60%, transparent)' : 'none' }}>
          {pct}<span className="result-percent">%</span>
        </div>
        <div className="result-caption">答對 {score} / {total} 題</div>
        {newRecord && (
          <div className="result-badge mt-3 inline-block rounded-full font-black tracking-widest animate-pop"
            style={{ background: 'color-mix(in srgb, var(--combo) 15%, transparent)', color: 'var(--combo)',
              border: '1px solid color-mix(in srgb, var(--combo) 50%, transparent)' }}>
            <span className="flex items-center gap-1.5"><Trophy size={18} strokeWidth={1.8} /> 新紀錄!超越了上次的自己</span>
          </div>
        )}
        {dailyAllDone && (
          <div className="result-badge mt-2 inline-block rounded-full font-black tracking-widest animate-pop"
            style={{ background: 'color-mix(in srgb, var(--good) 15%, transparent)', color: 'var(--good)',
              border: '1px solid color-mix(in srgb, var(--good) 50%, transparent)' }}>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={18} strokeWidth={1.8} /> 今日任務全部完成!</span>
          </div>
        )}
      </div>

      <div className="result-stats w-full" data-testid="result-stats">
        <div className="result-stat-row">
          <div><div className="result-stat-label">得分</div><div className="result-stat-value">{points}</div></div>
          <span className="result-stat-mark">POINTS</span>
        </div>
        <div className="result-stat-row">
          <div><div className="result-stat-label">用時</div><div className="result-stat-value">{fmtTime(timer)}</div></div>
          <span className="result-stat-mark">TIME</span>
        </div>
      </div>

      <div className="result-actions w-full flex flex-col gap-3">
        <button onClick={onReplay} data-testid="result-replay"
          className="result-primary w-full bg-accent text-accent-fg font-bold tracking-widest active:scale-[0.98] transition-all">
          再來一次
        </button>
        <button onClick={onMenu} data-testid="result-menu"
          className="result-secondary w-full border border-theme-border text-fg/70 font-bold tracking-widest active:scale-[0.98] transition-all">
          回選單
        </button>
      </div>
    </div>
  );
};
