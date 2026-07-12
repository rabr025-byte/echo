// src/components/AiGenerate.tsx
// [Echo] AI 生題庫 — 貼筆記/主題,AI 轉成題庫直接開玩
import { useState } from 'react';
import type { QuestionBank } from '../types/bank';
import type { AISettings } from '../lib/ai/types';
import { getProvider } from '../lib/ai';
import { genBankPrompt } from '../lib/ai/prompts';
import { validateBank } from '../lib/validateBank';

interface Props {
  settings: AISettings;
  onGenerated: (bank: QuestionBank) => void;
  onClose: () => void;
}

// 從 AI 回傳文字裡抽出 JSON(容錯:AI 有時會多包 markdown)
function extractJson(text: string): unknown {
  let t = text.trim();
  t = t.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

export const AiGenerate = ({ settings, onGenerated, onClose }: Props) => {
  const [topic, setTopic] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!settings.apiKey) { setError('請先到設定頁填入 API Key'); return; }
    if (topic.trim().length < 5) { setError('請輸入更多內容(至少 5 個字)'); return; }
    setLoading(true); setError('');
    try {
      const provider = getProvider(settings.provider);
      const prompt = genBankPrompt(topic, settings.genCount, settings.genDifficulty);
      const raw = await provider.generate(prompt, settings.apiKey);
      const parsed = extractJson(raw) as { questions?: unknown };

      // 組成完整題庫格式再驗證
      const bankName = name.trim() || 'AI 生成題庫';
      const bank = {
        bankId: `ai-${Date.now()}`,
        displayName: bankName,
        name: bankName,
        author: 'AI 生成',
        description: `由 AI 依「${topic.slice(0, 20)}…」生成`,
        questions: parsed.questions,
      };
      const result = validateBank(bank);
      if (!result.ok) {
        setError('AI 生成的題目格式有問題,請再試一次\n' + result.errors.slice(0, 3).join('\n'));
        return;
      }
      onGenerated(result.bank!);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 生成失敗,請再試一次');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col justify-end">
      <div className="max-w-md mx-auto w-full bg-bg border-t border-theme-border rounded-t-3xl p-6 pb-12 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold tracking-widest">✦ AI 生成題庫</h2>
          <button onClick={onClose} className="text-fg-dim text-sm">關閉</button>
        </div>

        <label className="text-xs text-fg-dim tracking-widest block mb-2">題庫名稱(選填)</label>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="例如:多益單字、台灣史"
          className="w-full bg-card border border-theme-border rounded-xl p-3 text-sm outline-none focus:border-accent/50 mb-4" />

        <label className="text-xs text-fg-dim tracking-widest block mb-2">主題或筆記內容</label>
        <textarea value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="貼上你的筆記,或輸入想出題的主題。內容越具體,題目越準。"
          rows={6}
          className="w-full bg-card border border-theme-border rounded-xl p-3 text-sm outline-none focus:border-accent/50 mb-2 resize-none" />
        <p className="text-fg-dim text-[10px] mb-4">
          將生成 {settings.genCount} 題 · 難度{settings.genDifficulty === 'easy' ? '簡單' : settings.genDifficulty === 'medium' ? '中等' : '困難'}(可在設定調整)
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-bad/10 border border-bad/30 text-bad text-xs whitespace-pre-wrap">{error}</div>
        )}

        <button onClick={handleGenerate} disabled={loading}
          className="w-full py-4 rounded-xl bg-accent text-accent-fg font-bold tracking-widest active:scale-[0.98] transition-all disabled:opacity-50">
          {loading ? 'AI 生成中…' : '生成並開始'}
        </button>
      </div>
    </div>
  );
};
