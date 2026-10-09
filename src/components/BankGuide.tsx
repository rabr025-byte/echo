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
      "source": "第3章 3.2 節",
      "question": "題目文字",
      "options": ["選項A", "選項B", "選項C", "選項D"],
      "answer": 0,
      "explanation": "簡短說明"
    },
    {
      "id": "e1",
      "type": "essay",
      "source": "第5章 風險管理",
      "question": "開放式問題",
      "options": [],
      "answer": 0,
      "rubric": "評分要點:需提到X、Y、Z"
    }
  ]
}`;

const RULES_COMMON = `**輸出規則**
- 只輸出 JSON,不要任何說明文字、不要用 \`\`\`json 包起來
- 全部使用繁體中文
- 不要加來源標記(如 [1]、[2])

**格式**
${FORMAT_BLOCK}

**數量與分批**
- 目標:選擇題 50 題 + 申論題 10 題
- 若內容太多無法一次輸出完,請先輸出前 25 題選擇題 + 5 題申論,結尾加一行 <!-- 尚有後續 -->,我會說「繼續」,你再輸出下一批(id 接續編號,bankId 加上 -part2)

**基本要求**
- answer 是正確選項的索引,從 0 開始(第一個選項 = 0)
- id 不可重複:選擇題 q1、q2…,申論題 e1、e2…
- 申論題必須有 rubric,options 填 [],answer 填 0
- 詳解精簡,控制在 30 字內(避免輸出過長)
- **每一題都要有 source 欄位**,標明這題出自資料的哪個章節、頁碼或段落標題(例如「第3章 3.2 節」「114年第二梯次 第5題」)。找不到明確章節時,填該段落的主題名稱`;

const EXAM_PROMPT = `我會提供一份文件/教材。請根據內容製作刷題題庫 JSON。

${RULES_COMMON}

**出題要求**
- 貼近考點,難度依教材深度
- 錯誤選項要合理但可辨別,不要明顯荒謬
- 涵蓋文件各章節,不要集中在同一段
- 申論題的 rubric 要具體列出應提到的關鍵概念`;

const LIFE_PROMPT = `我會提供一份資料(筆記/食譜/書摘等)。請根據內容製作問答遊戲題庫 JSON。

${RULES_COMMON}

**出題要求**
- 出題角度多元,不要只考死記:可考原理(為什麼)、判斷(某情況怎麼辦)、比較(A與B差別)、應用(換情境怎麼調整)
- 錯誤選項要合理但可辨別
- explanation 除了說明答案,盡量補一個有用的小知識
- 申論題設計成開放討論,rubric 列出合理的評分方向`;

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
          複製下面的指令,連同你的教材(PDF、筆記、講義都可以)一起丟給 ChatGPT、Claude、Gemini 等任何 AI。
          它會生成題庫 JSON,你把內容存成 .json 檔,再從題庫選單上傳即可。指令已內建分批機制,可產出 50 題以上。
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
          <div className="text-sm font-bold tracking-widest mb-2">💡 想要 100 題以上?</div>
          <p className="text-fg-dim text-[11px] leading-relaxed">
            所有 AI 單次輸出都有長度上限,約 25-50 題。指令已內建分批機制:AI 輸出第一批後會標示「尚有後續」,你回覆「繼續」即可拿到下一批。
            每批各自存檔上傳,或把多批合併成一個中括號 [ ] 的陣列一次上傳都可以。
          </p>
        </div>

        {/* 多題庫說明 */}
        <div className="mb-5 p-4 rounded-2xl border border-theme-border bg-card">
          <div className="text-sm font-bold tracking-widest mb-2">一個檔案有多份題庫?</div>
          <p className="text-fg-dim text-[11px] leading-relaxed">
            AI 有時會一次生出好幾份題庫,包在一個中括號 [ ] 的陣列裡。這種檔案可以直接上傳,Echo 會自動全部匯入成獨立題庫,不用手動拆開。
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
