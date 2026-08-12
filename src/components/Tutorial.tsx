// src/components/Tutorial.tsx
// [Echo] 互動式導引 — 首次開啟,逐步高亮真實畫面元素
// 原理:用 data-tour 屬性標記目標,遮罩挖洞高亮,點「下一步」推進

import { useState, useEffect, useCallback } from 'react';

interface Step {
  target: string;      // data-tour 的值;空字串 = 置中卡片(無高亮)
  title: string;
  text: string;
}

const STEPS: Step[] = [
  { target: '', title: '歡迎來到 Echo', text: '把刷題變成遊戲。目前載入的是 19 題的範例題庫,讓你先試玩;真正的用法是換上你自己的內容。跟著走一圈,30 秒上手。' },
  { target: 'bank', title: '這裡換成你的題庫', text: 'Echo 的核心是「題庫可以換」。點這裡上傳你自己的 JSON 題庫——考證照、背單字、讀書筆記、甚至食譜都可以。上傳後會自動儲存,下次打開還在。' },
  { target: 'start', title: '開始挑戰', text: '主戰場。答對疊 combo 加分,答錯碎一顆心,五顆心用完就結束。' },
  { target: 'modes', title: '更多模式', text: '進階 50 題、限時衝刺、極限一錯即死——各有玩法。' },
  { target: 'daily', title: '今日任務', text: '每天三個小目標,全完成有慶祝。記得每天回來點亮連續登入。' },
  { target: 'ai', title: 'AI 幫你做題庫', text: '不想手寫題庫?填入 API Key 後,把你的筆記或教材貼給 AI,它會直接生成一整套題目。設定裡也有現成的指令可以複製給 ChatGPT 用。' },
  { target: '', title: '準備好了', text: '先玩範例題熟悉一下,然後記得換上自己的題庫——那才是 Echo 真正好玩的地方。答題時也試試「押賭注」,分數翻倍但答錯扣兩顆心。' },
];

const KEY = 'echo:tutorial_done';
export const isTutorialDone = () => !!localStorage.getItem(KEY);

interface Props { onDone: () => void; }

export const Tutorial = ({ onDone }: Props) => {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = STEPS[idx];

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
    else { localStorage.setItem(KEY, '1'); onDone(); }
  };
  const skip = () => { localStorage.setItem(KEY, '1'); onDone(); };

  const pad = 8;
  // 提示卡位置:目標在上半部就放下面,反之放上面
  const cardBelow = !rect || rect.top < window.innerHeight / 2;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* 遮罩:有目標時挖洞(用超大 box-shadow 技巧) */}
      {rect ? (
        <div className="absolute rounded-2xl transition-all duration-300 pointer-events-none"
          style={{
            left: rect.left - pad, top: rect.top - pad,
            width: rect.width + pad * 2, height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)',
            border: '2px solid var(--accent)',
          }} />
      ) : (
        <div className="absolute inset-0 bg-black/78" />
      )}

      {/* 提示卡 */}
      <div className="absolute left-1/2 -translate-x-1/2 w-[85%] max-w-sm transition-all duration-300"
        style={rect
          ? (cardBelow ? { top: rect.bottom + pad + 16 } : { bottom: window.innerHeight - rect.top + pad + 16 })
          : { top: '50%', transform: 'translate(-50%, -50%)' }}>
        <div className="bg-bg border border-theme-border rounded-2xl p-5 shadow-2xl">
          <div className="text-[10px] text-fg-dim tracking-widest mb-1">{idx + 1} / {STEPS.length}</div>
          <div className="text-lg font-black tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{step.title}</div>
          <p className="text-sm text-fg/80 leading-relaxed mb-4">{step.text}</p>
          <div className="flex justify-between items-center">
            <button onClick={skip} className="text-fg-dim text-xs tracking-widest">跳過</button>
            <button onClick={next}
              className="px-6 py-2.5 rounded-xl bg-accent text-accent-fg text-sm font-bold tracking-widest active:scale-95 transition-transform">
              {idx < STEPS.length - 1 ? '下一步' : '開始!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
