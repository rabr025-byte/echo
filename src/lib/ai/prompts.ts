// src/lib/ai/prompts.ts
// [Echo] AI 提示詞集中管理

// AI 詳解:解釋某一題為什麼選這個答案
export const explainPrompt = (question: string, options: string[], answerText: string) => `
你是專業的教學助理。請用繁體中文,簡潔清楚地解釋下面這道選擇題。

題目:${question}
選項:${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}
正確答案:${answerText}

請說明:
1. 為什麼正確答案是對的(核心概念)
2. 其他選項為什麼不對(簡短即可)
請控制在 150 字內,不要用 markdown 標題,直接說明。
`.trim();

// AI 生題庫:把使用者的筆記/主題轉成題庫
export const genBankPrompt = (topic: string, count: number, difficulty: string) => `
你是出題專家。請根據以下主題或筆記,出 ${count} 道繁體中文的四選一選擇題,難度為「${difficulty}」。

主題/筆記:
${topic}

請「只」輸出符合以下格式的 JSON(不要有任何其他文字、不要用 markdown 包裹):
{
  "questions": [
    {
      "id": "ai1",
      "question": "題目文字",
      "options": ["選項A", "選項B", "選項C", "選項D"],
      "answer": 0,
      "explanation": "簡短詳解"
    }
  ]
}
注意:answer 是正確選項的索引(0 到 3)。id 用 ai1, ai2... 依序編號。
`.trim();

// AI 幻影:即時生一題與題庫主題相關的新題
export const phantomPrompt = (bankName: string, difficulty: string) => `
你是出題專家。請針對「${bankName}」這個主題,出 1 道繁體中文四選一選擇題,難度「${difficulty}」。
請「只」輸出 JSON(不要其他文字、不要 markdown):
{ "id": "phantom", "question": "題目", "options": ["A","B","C","D"], "answer": 0, "explanation": "詳解" }
answer 是 0 到 3 的索引。
`.trim();


// 申論題評分:依評分要點給 0-100 分與短評
export const gradeEssayPrompt = (question: string, rubric: string, userAnswer: string) => `
你是嚴謹但友善的閱卷老師。請評分以下申論題作答。

題目:${question}
評分要點:${rubric || '依題目要求的完整性、正確性、邏輯性評分'}
學生作答:${userAnswer}

請「只」輸出 JSON(不要其他文字、不要 markdown):
{ "score": 85, "comment": "答到了X和Y,但漏了Z。建議補充…" }
score 是 0-100 整數,comment 是 80 字內的繁體中文短評,先講答對什麼再講缺什麼。
`.trim();
