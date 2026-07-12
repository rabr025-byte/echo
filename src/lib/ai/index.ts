// src/lib/ai/index.ts
// [Echo] AI 供應商註冊表 — 依 provider 名稱取得對應實作
import type { AIProvider } from './types';
import { geminiProvider } from './gemini';

const PROVIDERS: Record<string, AIProvider> = {
  gemini: geminiProvider,
  // 未來:openai: openaiProvider, claude: claudeProvider
};

export const getProvider = (name: string): AIProvider =>
  PROVIDERS[name] ?? geminiProvider;

export const PROVIDER_LIST = Object.entries(PROVIDERS).map(([id, p]) => ({ id, name: p.name }));
