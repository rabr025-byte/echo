// src/components/Quiz.tsx
// [Echo] 答題畫面 v2 — 多巴胺爆發版
import { useGame } from '../lib/useGame';
import { useState, useEffect, useRef } from 'react';

interface Props {
  game: ReturnType<typeof useGame>;
  onQuit: () => void;
  onAiExplain?: (q: { question: string; options: string[]; answerText: string }) => Promise<string>;
  devMode?: boolean;
}

interface Particle { id: number; dx: number; dy: number; }

export const Quiz = ({ game, onQuit, onAiExplain, devMode }: Props) => {
  const { current, currentIdx, questions, selected, answered, hp, combo, comboBurst, points, floats, shake, HP_MAX } = game;
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [flash, setFlash] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [comboKey, setComboKey] = useState(0);
  const lastBurst = useRef(0);

  useEffect(() => {
    if (comboBurst > lastBurst.current) {
      lastBurst.current = comboBurst;
      setFlash(true);
      setTimeout(() => setFlash(false), 500);
      const ps = Array.from({ length: 16 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 16;
        const dist = 80 + Math.random() * 60;
        return { id: Date.now() + i, dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist };
      });
      setParticles(ps);
      setTimeout(() => setParticles([]), 800);
    }
  }, [comboBurst]);

  useEffect(() => { if (combo > 0) setComboKey(k => k + 1); }, [combo]);

  if (!current) return null;

  const handleAi = async () => {
    if (!onAiExplain) return;
    setAiLoading(true); setAiError(''); setAiText('');
    try {
      const text = await onAiExplain({
        question: current.question, options: current.options,
        answerText: current.options[current.answer],
      });
      setAiText(text);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI 解讀失敗');
    } finally { setAiLoading(false); }
  };

  return (
    <div className={`min-h-screen max-w-md mx-auto w-full px-5 py-6 flex flex-col ${shake ? 'animate-[shake_0.4s]' : ''}`}>
      {flash && (
        <div className="fixed inset-0 z-40 pointer-events-none animate-flash"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--combo) 40%, transparent) 0%, transparent 70%)' }} />
      )}

      <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
        {particles.map(p => (
          <div key={p.id} className="absolute w-2 h-2 rounded-full animate-particle"
            style={{ background: 'var(--combo)', '--dx': `${p.dx}px`, '--dy': `${p.dy}px` } as React.CSSProperties} />
        ))}
      </div>

      <div className="fixed inset-0 pointer-events-none z-50">
        {floats.map(f => (
          <div key={f.id}
            className={`absolute font-black text-2xl animate-burst ${f.kind === 'good' ? 'text-good' : 'text-bad'}`}
            style={{ left: f.x, top: f.y, textShadow: f.kind === 'good' ? '0 0 12px color-mix(in srgb, var(--good) 60%, transparent)' : 'none' }}>
            {f.text}
          </div>
        ))}
      </div>

      {/* 連擊能量光框(combo 越高越亮) */}
      {combo >= 3 && (
        <div className="combo-vignette"
          style={{ '--combo-glow': `${Math.min(combo * 12, 120)}`, '--combo-alpha': `${Math.min(combo * 6, 55)}` } as React.CSSProperties} />
      )}

      {/* combo 大字(畫面中上,每次答對重播彈出) */}
      {combo > 1 && (
        <div key={comboKey} className="fixed top-[16%] left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-combo-slam">
          <div className="text-center">
            <span className="font-black tabular-nums"
              style={{ color: 'var(--combo)', fontSize: `${Math.min(2 + combo * 0.15, 4)}rem`,
                textShadow: `0 0 ${Math.min(combo * 3, 30)}px color-mix(in srgb, var(--combo) 80%, transparent)` }}>
              {combo}
            </span>
            <span className="block text-[10px] font-bold tracking-[0.4em] -mt-1"
              style={{ color: 'var(--combo)' }}>COMBO</span>
          </div>
        </div>
      )}

      {/* 頂部:愛心血量 + 退出 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          {Array.from({ length: HP_MAX / 20 }).map((_, i) => {
            const heartsLeft = Math.ceil(hp / 20);
            const alive = i < heartsLeft;
            const isLast = alive && heartsLeft === 1;
            const justBroke = i === heartsLeft && answered; // 剛碎的那顆播碎裂
            return (
              <span key={`${i}-${alive}`}
                className={`text-xl ${justBroke ? 'animate-heart-break' : isLast ? 'animate-heart-panic' : ''}`}
                style={{
                  color: alive ? 'var(--bad)' : 'color-mix(in srgb, var(--fg-dim) 35%, transparent)',
                  filter: alive ? 'drop-shadow(0 0 4px color-mix(in srgb, var(--bad) 50%, transparent))' : 'none',
                }}>
                ♥
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          {devMode && !answered && (
            <button
              onClick={() => game.answer(current.answer, window.innerWidth / 2, window.innerHeight / 3)}
              className="text-combo text-xs tracking-widest border border-theme-border rounded-lg px-2 py-1 active:scale-95">
              ⚡自動答對
            </button>
          )}
          <button onClick={onQuit} className="text-fg-dim text-xs tracking-widest active:scale-95">結束</button>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-fg-dim mb-6 tabular-nums">
        <span>{currentIdx + 1} / {questions.length}</span>
        <span className="font-mono">{points} 分</span>
      </div>

      <div className="mb-6">
        {current.source && <div className="text-fg-dim text-[10px] mb-2 tracking-wider">{current.source}</div>}
        <p className="text-lg leading-relaxed font-medium">{current.question}</p>
      </div>

      <div className="flex flex-col gap-3">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.answer;
          const isPicked = i === selected;
          let cls = 'border-theme-border bg-card';
          if (answered) {
            if (isCorrect) cls = 'border-good/60 bg-good/10 glow-accent';
            else if (isPicked) cls = 'border-bad/60 bg-bad/10';
            else cls = 'border-theme-border bg-transparent opacity-40';
          }
          return (
            <button key={i} disabled={answered}
              onClick={e => game.answer(i, e.clientX, e.clientY)}
              className={`w-full p-4 rounded-xl border text-left transition-all active:scale-[0.99] ${cls} ${answered && isCorrect ? 'animate-pop' : ''}`}>
              <span className="text-sm leading-relaxed">{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-6">
          {current.explanation && (
            <div className="p-4 rounded-xl bg-card border border-theme-border mb-4">
              <div className="text-fg-dim text-[10px] tracking-widest mb-1">詳解</div>
              <p className="text-sm text-fg/70 leading-relaxed">{current.explanation}</p>
            </div>
          )}

          {onAiExplain && (
            <div className="mb-4">
              {!aiText && !aiLoading && (
                <button onClick={handleAi}
                  className="w-full py-3 rounded-xl border border-theme-border text-fg-dim text-sm font-bold tracking-widest active:scale-[0.98] transition-all">
                  ✦ AI 解讀這題
                </button>
              )}
              {aiLoading && <div className="w-full py-3 text-center text-fg-dim text-sm animate-pulse">AI 思考中…</div>}
              {aiError && <div className="p-3 rounded-xl bg-bad/10 border border-bad/30 text-bad text-xs">{aiError}</div>}
              {aiText && (
                <div className="p-4 rounded-xl bg-card border border-accent/30">
                  <div className="text-fg-dim text-[10px] tracking-widest mb-1">✦ AI 解讀</div>
                  <p className="text-sm text-fg/80 leading-relaxed whitespace-pre-wrap">{aiText}</p>
                </div>
              )}
            </div>
          )}

          <button onClick={game.next}
            className="w-full py-4 rounded-xl bg-accent text-accent-fg font-bold tracking-widest active:scale-[0.98] transition-all">
            {currentIdx < questions.length - 1 ? '下一題' : '看結果'}
          </button>
        </div>
      )}
    </div>
  );
};
