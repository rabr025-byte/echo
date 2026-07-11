// src/types/bank.ts
// [Echo] 題庫格式定義 — 通用版核心
// 任何題庫 JSON 都必須符合這個結構,詳見題庫格式說明文件

export interface Question {
  id: string;            // 題目唯一 id(題庫內不可重複)
  question: string;      // 題目文字
  options: string[];     // 選項(至少 2 個)
  answer: number;        // 正解索引(0 起算)
  explanation?: string;  // 詳解(選填)
  source?: string;       // 題目出處(選填)
  subject?: number;      // 科目編號(選填,考試類題庫用)
  category?: number;     // 分類編號(選填)
}

export interface QuestionBank {
  bankId: string;        // 題庫唯一識別碼(進度隔離用,不同題庫絕不能相同)
  displayName: string;   // 顯示名稱(App 標題會變成「Echo · {displayName}」)
  name: string;          // 完整名稱
  author?: string;       // 題庫作者(選填)
  description?: string;  // 說明(選填)
  questions: Question[];
}
