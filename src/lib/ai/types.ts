// src/lib/ai/types.ts
// [Echo] AI 供應商抽象層 — 讓 Gemini / OpenAI / Claude 可互換
// 未來加新供應商只要實作 AIProvider 介面,其他程式碼不用改

export interface AIProvider {
  name: string;
  // 純文字生成:給 prompt,回傳文字
  generate(prompt: string, apiKey: string): Promise<string>;
}

export interface AISettings {
  provider: string;   // 'gemini' | 未來擴充
  apiKey: string;
  genCount: number;   // AI 生題庫時預設題數
  genDifficulty: 'easy' | 'medium' | 'hard';
  sfxEnabled: boolean;
  vibrateEnabled: boolean;
  theme: 'midnight' | 'paper' | 'neon';
  devMode: boolean;   // 測試模式:答題頁出現自動答對按鈕
  quizCount: number;  // 標準模式每局題數(0 = 全部)
}

export const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKey: '',
  genCount: 10,
  genDifficulty: 'medium',
  sfxEnabled: true,
  vibrateEnabled: true,
  theme: 'midnight',
  devMode: false,
  quizCount: 10,
};
