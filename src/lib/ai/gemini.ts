// src/lib/ai/gemini.ts
// [Echo] Gemini 供應商實作
// 直接從瀏覽器呼叫 Gemini API(key 存使用者本機,適用「各自填 key」情境)

import type { AIProvider } from './types';

const GEMINI_MODEL = 'gemini-2.0-flash'; // 快、便宜,適合即時生題/詳解

export const geminiProvider: AIProvider = {
  name: 'Gemini',
  async generate(prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error('尚未設定 API Key');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      if (res.status === 400) throw new Error('API Key 無效或請求格式錯誤');
      if (res.status === 429) throw new Error('已達 API 使用上限,請稍後再試');
      throw new Error(`AI 服務錯誤 (${res.status})`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('AI 沒有回傳內容');
    return text;
  },
};
