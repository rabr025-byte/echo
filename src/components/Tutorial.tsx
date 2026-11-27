// src/components/Tutorial.tsx
// [Echo] 互動式導引 — 首次開啟,逐步高亮真實畫面元素
// 原理:用 data-tour 屬性標記目標,遮罩挖洞高亮,點「下一步」推進

import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/visual-stats.css';

interface Step {
  target: string;      // data-tour 的值;空字串 = 置中卡片(無高亮)
  title: string;
  text: string;
}

const STEPS: Step[] = [
  { target: 'start', title: '先玩一局看看', text: '先用範例題庫試玩一局。' },
  { target: 'bank', title: '換成你的題庫', text: '把自己的題目放進 Echo。' },
  { target: 'ai', title: 'AI 幫你出題', text: '把筆記交給 AI 變成題目。' },
  { target: 'daily', title: '每天回來', text: '完成每日任務，累積連續登入。' },
];

const KEY = 'echo:tutorial_done';
export const isTutorialDone = () => !!localStorage.getItem(KEY);

interface Props { onDone: () => void; }

export const Tutorial = ({ onDone }: Props) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = STEPS[idx];
  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') skip(); };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); returnFocusRef.current?.focus(); };
  }, []);

  // 找目標元素位置(視窗變化也重算)
  const measure = useCallback(() => {
    if (!step.target) { setRect(null); return; }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      setRect(el.getBoundingClientRect());
    } else setRect(null);
  }, [step.target]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const next = () => {
    if (idx < STEPS.length - 1) setIdx(idx + 1);
    else {
      localStorage.setItem(KEY, '1');
      onDone();
      // 直接觸發選單既有的開始 handler，避免導覽複製一份開局邏輯。
      document.querySelector<HTMLButtonElement>('[data-tour="start"]')?.click();
    }
  };
  const skip = () => { localStorage.setItem(KEY, '1'); onDone(); };

  const pad = 8;
  // 提示卡位置:目標在上半部就放下面,反之放上面
  const cardBelow = !rect || rect.top < window.innerHeight / 2;

  return (
    <div ref={dialogRef} tabIndex={-1} className="tutorial-visual fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" aria-describedby="tutorial-description">
      {/* 遮罩:有目標時挖洞(用超大 box-shadow 技巧) */}
      {rect ? (
        <div className="tutorial-spotlight absolute rounded-2xl transition-all duration-300 pointer-events-none"
          style={{
            left: rect.left - pad, top: rect.top - pad,
            width: rect.width + pad * 2, height: rect.height + pad * 2,
          }} />
      ) : (
        <div className="tutorial-dim absolute inset-0" />
      )}

      {/* 提示卡 */}
      <div className="absolute left-1/2 -translate-x-1/2 w-[85%] max-w-sm transition-all duration-300"
        style={rect
          ? (cardBelow ? { top: rect.bottom + pad + 16 } : { bottom: window.innerHeight - rect.top + pad + 16 })
          : { top: '50%', transform: 'translate(-50%, -50%)' }}>
        <div className="tutorial-card bg-bg border border-theme-border rounded-2xl p-5">
          <div className="tutorial-progress flex items-center justify-between mb-3">
            <div className="text-[10px] text-fg-dim tracking-widest">步驟 {String(idx + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}</div>
            <div className="tutorial-progress-dots" aria-hidden="true">
              {STEPS.map((_, stepIndex) => <span key={stepIndex} className={stepIndex <= idx ? 'is-filled' : ''} />)}
            </div>
          </div>
          <div id="tutorial-title" className="text-lg font-black tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{step.title}</div>
          <p id="tutorial-description" className="text-sm text-fg/80 leading-relaxed mb-4">{step.text}</p>
          <div className="flex justify-between items-center">
            <button onClick={skip} className="tutorial-skip text-fg-dim text-xs tracking-widest">跳過</button>
            <button onClick={next}
              className="tutorial-next px-6 py-2.5 rounded-xl bg-accent text-accent-fg text-sm font-bold tracking-widest active:scale-95 transition-transform">
              {idx < STEPS.length - 1 ? '下一步' : '開始第一局'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
