// src/components/Settings.tsx
// [Echo] 設定頁 — arcade meets editorial：安靜分組、清楚說明、保留既有行為
import { useState, type CSSProperties } from 'react';
import { Check, ChevronRight, KeyRound, Moon, Palette, RotateCcw, SlidersHorizontal, Sparkles, Volume2, VolumeX, Vibrate, X } from 'lucide-react';
import type { AISettings } from '../lib/ai/types';
import { PROVIDER_LIST } from '../lib/ai';
import { THEMES, type ThemeId, applyTheme } from '../lib/themes';
import '../styles/visual-settings.css';

interface Props {
  settings: AISettings;
  onSave: (s: AISettings) => void;
  onClose: () => void;
  onOpenGuide: () => void;
}

const DIFFICULTIES = [
  { id: 'easy', label: '簡單' },
  { id: 'medium', label: '中等' },
  { id: 'hard', label: '困難' },
] as const;

export const Settings = ({ settings, onSave, onClose, onOpenGuide }: Props) => {
  const [draft, setDraft] = useState<AISettings>(settings);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof AISettings>(k: K, v: AISettings[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  // 主題即時預覽
  const applyThemeLive = (id: ThemeId) => applyTheme(id);

  // 關閉但沒儲存 → 還原成原本已儲存的主題
  const handleClose = () => {
    applyTheme(settings.theme);
    onClose();
  };

  const handleSave = () => {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const themeStyle = (id: ThemeId) => ({
    '--swatch-bg': THEMES[id].vars['--bg'],
    '--swatch-fg': THEMES[id].vars['--fg'],
    '--swatch-accent': THEMES[id].vars['--accent'],
    '--swatch-card': THEMES[id].vars['--card'],
  }) as CSSProperties;

  return (
    <div className="settings-backdrop fixed inset-0 z-50 flex flex-col justify-end">
      <div className="settings-panel max-w-md mx-auto w-full bg-bg max-h-[92vh] overflow-y-auto safe-bottom">
        <header className="settings-header">
          <div>
            <div className="settings-eyebrow">ECHO / CONTROL ROOM</div>
            <h2 className="settings-title">設定</h2>
            <p className="settings-subtitle">調整你的練習節奏，變更會在儲存後保留。</p>
          </div>
          <button onClick={handleClose} className="settings-close" aria-label="關閉設定">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <main className="settings-content">
          <section className="settings-section" aria-labelledby="settings-look">
            <div className="settings-section-heading"><span className="settings-section-index">01</span><h3 id="settings-look">外觀</h3></div>
            <div className="settings-row settings-row-stack">
              <div className="settings-row-copy"><div className="settings-label"><Palette size={15} aria-hidden="true" />主題</div><p>選擇一個陪你讀題的色調</p></div>
              <div className="settings-theme-grid" role="group" aria-label="選擇主題">
                {(Object.keys(THEMES) as ThemeId[]).map(id => (
                  <button key={id} type="button" onClick={() => { update('theme', id); applyThemeLive(id); }} className={`settings-theme-swatch ${draft.theme === id ? 'is-selected' : ''}`} style={themeStyle(id)} aria-pressed={draft.theme === id} aria-label={`${THEMES[id].name}主題`}>
                    <span className="settings-swatch-preview" aria-hidden="true"><span className="settings-swatch-line" /><span className="settings-swatch-dot" /><span className="settings-swatch-card" /></span>
                    <span>{THEMES[id].name}</span>{draft.theme === id && <Check size={13} aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="settings-section" aria-labelledby="settings-ai">
            <div className="settings-section-heading"><span className="settings-section-index">02</span><h3 id="settings-ai">AI 連線</h3></div>
            <div className="settings-row settings-row-stack">
              <div className="settings-row-copy"><div className="settings-label"><Sparkles size={15} aria-hidden="true" />供應商</div><p>用於生題與 AI 輔助功能</p></div>
              <div className="settings-segmented" role="group" aria-label="選擇 AI 供應商">
                {PROVIDER_LIST.map(p => <button key={p.id} type="button" onClick={() => update('provider', p.id)} className={draft.provider === p.id ? 'is-selected' : ''} aria-pressed={draft.provider === p.id}>{p.name}</button>)}
              </div>
            </div>
            <div className="settings-row settings-row-stack settings-key-row">
              <div className="settings-row-copy"><div className="settings-label"><KeyRound size={15} aria-hidden="true" />API Key</div><p>只存在你的瀏覽器，由你的裝置直接呼叫 AI。</p></div>
              <input id="settings-api-key" type="password" value={draft.apiKey} onChange={e => update('apiKey', e.target.value)} placeholder="貼上你的 API Key" autoComplete="off" aria-label="API Key" className="settings-input" />
              <p className="settings-helper">Echo 沒有後端，不會收集或上傳這組 Key；離開此裝置前請記得清除。</p>
            </div>
          </section>

          <section className="settings-section" aria-labelledby="settings-practice">
            <div className="settings-section-heading"><span className="settings-section-index">03</span><h3 id="settings-practice">練習偏好</h3></div>
            <div className="settings-row settings-row-stack">
              <div className="settings-row-copy"><div className="settings-label"><SlidersHorizontal size={15} aria-hidden="true" />生題難度</div><p>AI 生成題庫時的預設難度</p></div>
              <div className="settings-segmented" role="group" aria-label="選擇 AI 生題難度">
                {DIFFICULTIES.map(d => <button key={d.id} type="button" onClick={() => update('genDifficulty', d.id)} className={draft.genDifficulty === d.id ? 'is-selected' : ''} aria-pressed={draft.genDifficulty === d.id}>{d.label}</button>)}
              </div>
            </div>
            <div className="settings-row settings-range-row">
              <div className="settings-row-copy"><div className="settings-label">每次生題數量</div><p>生成題庫時的預設題數</p></div>
              <output className="settings-range-value" htmlFor="settings-gen-count">{draft.genCount}<span>題</span></output>
              <input id="settings-gen-count" type="range" min={5} max={20} step={1} value={draft.genCount} onChange={e => update('genCount', Number(e.target.value))} className="settings-range" aria-label="AI 生題數量" />
            </div>
            <div className="settings-toggle-list">
              <div className="settings-toggle-row"><div className="settings-label"><Volume2 size={15} aria-hidden="true" />音效</div><button type="button" onClick={() => update('sfxEnabled', !draft.sfxEnabled)} className={`settings-switch ${draft.sfxEnabled ? 'is-on' : ''}`} aria-pressed={draft.sfxEnabled} aria-label={`音效${draft.sfxEnabled ? '開啟' : '關閉'}`}><span /></button></div>
              <div className="settings-toggle-row"><div className="settings-label"><Vibrate size={15} aria-hidden="true" />震動回饋</div><button type="button" onClick={() => update('vibrateEnabled', !draft.vibrateEnabled)} className={`settings-switch ${draft.vibrateEnabled ? 'is-on' : ''}`} aria-pressed={draft.vibrateEnabled} aria-label={`震動回饋${draft.vibrateEnabled ? '開啟' : '關閉'}`}><span /></button></div>
            </div>
          </section>

          <button type="button" onClick={onOpenGuide} className="settings-guide-row"><span className="settings-guide-icon"><Moon size={16} aria-hidden="true" /></span><span><strong>自己做題庫</strong><small>取得 AI 指令，從你的筆記開始</small></span><ChevronRight size={17} aria-hidden="true" /></button>

          <section className="settings-danger" aria-labelledby="settings-danger-title">
            <div className="settings-danger-heading"><div><div className="settings-eyebrow">USE WITH CARE</div><h3 id="settings-danger-title">危險區</h3></div><RotateCcw size={16} aria-hidden="true" /></div>
            <div className="settings-toggle-row"><div><div className="settings-label"><VolumeX size={15} aria-hidden="true" />測試模式</div><p className="settings-danger-copy">答題頁顯示「自動答對」，只建議開發測試時使用。</p></div><button type="button" onClick={() => update('devMode', !draft.devMode)} className={`settings-switch settings-switch-danger ${draft.devMode ? 'is-on' : ''}`} aria-pressed={draft.devMode} aria-label={`測試模式${draft.devMode ? '開啟' : '關閉'}`}><span /></button></div>
          </section>
        </main>

        <footer className="settings-actions"><button type="button" onClick={handleClose} className="settings-cancel">取消</button><button type="button" onClick={() => { handleSave(); setTimeout(() => { onClose(); }, 600); }} className="settings-save">{saved ? <><Check size={16} aria-hidden="true" />已儲存</> : '儲存設定'}</button></footer>
      </div>
    </div>
  );
};
