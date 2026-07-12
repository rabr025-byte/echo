// src/components/Settings.tsx
// [Echo] 設定頁 — AI 供應商、API Key、生題偏好、音效震動
import { useState } from 'react';
import type { AISettings } from '../lib/ai/types';
import { PROVIDER_LIST } from '../lib/ai';

interface Props {
  settings: AISettings;
  onSave: (s: AISettings) => void;
  onClose: () => void;
}

export const Settings = ({ settings, onSave, onClose }: Props) => {
  const [draft, setDraft] = useState<AISettings>(settings);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof AISettings>(k: K, v: AISettings[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  const handleSave = () => {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-sm flex flex-col justify-end">
      <div className="max-w-md mx-auto w-full bg-ink border-t border-parchment/15 rounded-t-3xl p-6 pb-12 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold tracking-widest">設定</h2>
          <button onClick={onClose} className="text-parchment/40 text-sm">關閉</button>
        </div>

        {/* AI 供應商 */}
        <div className="mb-5">
          <label className="text-xs text-parchment/40 tracking-widest block mb-2">AI 供應商</label>
          <div className="flex gap-2">
            {PROVIDER_LIST.map(p => (
              <button key={p.id} onClick={() => update('provider', p.id)}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold tracking-widest transition-all ${
                  draft.provider === p.id
                    ? 'border-parchment/40 bg-parchment/10'
                    : 'border-parchment/10 text-parchment/50'
                }`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="mb-5">
          <label className="text-xs text-parchment/40 tracking-widest block mb-2">API Key</label>
          <input type="password" value={draft.apiKey}
            onChange={e => update('apiKey', e.target.value)}
            placeholder="貼上你的 API Key"
            className="w-full bg-parchment/[0.04] border border-parchment/15 rounded-xl p-3 text-sm outline-none focus:border-parchment/40" />
          <p className="text-parchment/30 text-[10px] mt-2 leading-relaxed">
            API Key 僅儲存在你的裝置,不會上傳到任何伺服器。AI 功能會直接從你的瀏覽器呼叫。
          </p>
        </div>

        {/* 生題偏好 */}
        <div className="mb-5">
          <label className="text-xs text-parchment/40 tracking-widest block mb-2">AI 生題難度</label>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button key={d} onClick={() => update('genDifficulty', d)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold tracking-widest transition-all ${
                  draft.genDifficulty === d
                    ? 'border-parchment/40 bg-parchment/10'
                    : 'border-parchment/10 text-parchment/50'
                }`}>
                {d === 'easy' ? '簡單' : d === 'medium' ? '中等' : '困難'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs text-parchment/40 tracking-widest block mb-2">AI 生題數量:{draft.genCount} 題</label>
          <input type="range" min={5} max={20} step={1} value={draft.genCount}
            onChange={e => update('genCount', Number(e.target.value))}
            className="w-full accent-parchment" />
        </div>

        {/* 開關 */}
        <div className="flex flex-col gap-3 mb-6">
          {([['sfxEnabled', '音效'], ['vibrateEnabled', '震動回饋']] as const).map(([k, label]) => (
            <div key={k} className="flex justify-between items-center">
              <span className="text-sm">{label}</span>
              <button onClick={() => update(k, !draft[k])}
                className={`w-11 h-6 rounded-full transition-all relative ${draft[k] ? 'bg-parchment' : 'bg-parchment/20'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-ink transition-all ${draft[k] ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={handleSave}
          className="w-full py-4 rounded-xl bg-parchment text-ink font-bold tracking-widest active:scale-[0.98] transition-all">
          {saved ? '✓ 已儲存' : '儲存設定'}
        </button>
      </div>
    </div>
  );
};
