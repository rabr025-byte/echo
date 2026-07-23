// src/components/BankGuide.tsx
// [Echo] 題庫製作指南 — 提供可複製的 AI prompt,教使用者用 ChatGPT/NotebookLM 生題庫
import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

interface Props { onClose: () => void; }

const FORMAT_BLOCK = `{
  "bankId": "唯一英文識別碼",
  "displayName": "簡短顯示名",
  "name": "完整題庫名稱",
  "author": "你的名字",
  "description": "一句話說明",
  "questions": [
    {
      "id": "q1",
      "question": "題目文字",
      "options": ["選項A", "選項B", "選項C", "選項D"],
      "answer": 0,
      "explanation": "簡短說明"
    },
    {
      "id": "e1",
      "type": "essay",
      "question": "開放式問題",
      "options": [],
      "answer": 0,
      "rubric": "評分要點:需提到X、Y、Z"
    }
  ]
}`;

const EXAM_PROMPT = `請根據我提供的資料,製作一份刷題題庫 JSON。嚴格遵守以下格式,只輸出 JSON,不要其他文字:

${FORMAT_BLOCK}

規則:
1. answer 是正確選項的索引,從 0 開始(第一個選項=0)
2. id 不可重複,選擇題用 q1,q2…,申論題用 e1,e2…
3. 選擇題 20 題、申論題 5 題
4. 申論題必須有 rubric、options 填 []、answer 填 0
5. 全部使用繁體中文
6. 難度依資料深度出題,錯誤選項要合理但可辨別
7. 不要在文字裡加來源標記(如 [1]、[2])`;

const LIFE_PROMPT = `請根據我提供的資料,製作一份問答遊戲題庫 JSON。嚴格遵守以下格式,只輸出 JSON,不要其他文字:

${FORMAT_BLOCK}

規則:
1. answer 是正確選項的索引,從 0 開始
2. id 不可重複,選擇題用 q1,q2…,申論題用 e1,e2…
3. 選擇題 20 題、申論題 5 題
4. 申論題必須有 rubric、options 填 []、answer 填 0
5. 全部繁體中文
6. 出題角度多元,不要只考死記:可考原理(為什麼)、判斷(某情況怎麼辦)、比較(A與B差別)、應用(換情境怎麼調整)
7. 錯誤選項要合理但可辨別
8. explanation 除了說明答案,盡量補一個有用的小知識
9. 不要在文字裡加來源標記(如 [1]、[2])`;

export const BankGuide = ({ onClose }: Props) => {
  const [copied, setCopied] = useState<string>('');

  const copy = (text: string, tag: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(tag);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  const CopyBtn = ({ text, tag, label }: { text: string; tag: string; label: string }) => (
    <button onClick={() => copy(text, tag)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-fg text-xs font-bold tracking-widest active:scale-95 transition-transform">
      {copied === tag ? <Check size={13} /> : <Copy size={13} />}
      {copied === tag ? '已複製' : label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col justify-end">
      <div className="max-w-md mx-auto w-full bg-bg border-t border-theme-border rounded-t-3xl p-6 pb-12 max-h-[88vh] overflow-y-auto safe-bottom">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold tracking-widest">自己做題庫</h2>
          <button onClick={onClose} className="text-fg-dim"><X size={20} /></button>
        </div>
        <p className="text-fg-dim text-xs leading-relaxed mb-5">
          把下面的指令複製給 ChatGPT、Claude 或 NotebookLM,連同你的教材/筆記一起貼上,它會生成題庫 JSON。存成 .json 檔後,從題庫選單上傳即可。
        </p>

        {/* 考試導向 */}
        <div className="mb-5 p-4 rounded-2xl border border-theme-border bg-card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold tracking-widest">📘 考試 / 學科</span>
            <CopyBtn text={EXAM_PROMPT} tag="exam" label="複製指令" />
          </div>
          <p className="text-fg-dim text-[11px] leading-relaxed">適合證照、考試、專業知識。出題嚴謹、貼近考點。</p>
        </div>

        {/* 生活知識導向 */}
        <div className="mb-5 p-4 rounded-2xl border border-theme-border bg-card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold tracking-widest">🍳 生活 / 興趣</span>
            <CopyBtn text={LIFE_PROMPT} tag="life" label="複製指令" />
          </div>
          <p className="text-fg-dim text-[11px] leading-relaxed">適合食譜、書摘、興趣知識。出題活潑、角度多元。</p>
        </div>

        {/* 分批提示 */}
        <div className="mb-5 p-4 rounded-2xl border border-accent/30 bg-accent/5">
          <div className="text-sm font-bold tracking-widest mb-2">💡 資料很多怎麼辦?</div>
          <p className="text-fg-dim text-[11px] leading-relaxed">
            AI 單次輸出有長度限制,一次約生 25 題。若教材很長,分批下指令,例如「先針對第 3 章出 25 題」「再針對第 4 章出 25 題」。每份各自上傳成獨立題庫即可,進度互不影響。
          </p>
        </div>

        {/* 格式參考 */}
        <div className="p-4 rounded-2xl border border-theme-border bg-card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold tracking-widest">格式參考</span>
            <CopyBtn text={FORMAT_BLOCK} tag="format" label="複製格式" />
          </div>
          <pre className="text-[9px] text-fg-dim leading-relaxed overflow-x-auto whitespace-pre">{FORMAT_BLOCK}</pre>
        </div>
      </div>
    </div>
  );
};
