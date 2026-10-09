// src/types/bank.ts
// [Echo] 題庫格式定義 — 通用版核心
// 任何題庫 JSON 都必須符合這個結構,詳見題庫格式說明文件

export interface Question {
  id: string;            // 題目唯一 id(題庫內不可重複)
  type?: 'choice' | 'essay'; // 題型:選擇(預設)或申論
  question: string;      // 題目文字
  options: string[];     // 選項(選擇題必填;申論題可為空陣列)
  answer: number;        // 正解索引(選擇題用;申論題填 0 即可)
  rubric?: string;       // 申論題評分要點(給 AI 當評分標準)
  explanation?: string;  // 詳解(選填)
  source?: string;       // 題目出處(選填)
  subject?: number;      // 科目編號(選填,考試類題庫用)
  category?: number;     // 分類編號(選填)
  sourceBankId?: string;     // 組合題庫用:這題原本屬於哪個題庫
  sourceQuestionId?: string; // 組合題庫用:這題在原題庫的 id
}

export interface QuestionBank {
  bankId: string;        // 題庫唯一識別碼(進度隔離用,不同題庫絕不能相同)
  displayName: string;   // 顯示名稱(App 標題會變成「Echo · {displayName}」)
  name: string;          // 完整名稱
  author?: string;       // 題庫作者(選填)
  description?: string;  // 說明(選填)
  questions: Question[];
}
