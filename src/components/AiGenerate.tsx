// src/components/AiGenerate.tsx
// [Echo] AI 生題庫 — 三步驟流程:貼筆記、調整選項、預覽並儲存
import { useState } from 'react';
import { ArrowLeft, Check, ChevronRight, FileText, Save, Sparkles } from 'lucide-react';
import type { QuestionBank } from '../types/bank';
import type { AISettings } from '../lib/ai/types';
import { getProvider } from '../lib/ai';
import { genBankPrompt } from '../lib/ai/prompts';
import { validateBank } from '../lib/validateBank';
import '../styles/visual-ai.css';

interface Props {
  settings: AISettings;
  onGenerated: (bank: QuestionBank) => void;
  onClose: () => void;
}

type Stage = 'input' | 'generating' | 'preview';

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
  const [stage, setStage] = useState<Stage>('input');
  const [generatedBank, setGeneratedBank] = useState<QuestionBank | null>(null);

  const difficulty = settings.genDifficulty === 'easy' ? '簡單' : settings.genDifficulty === 'medium' ? '中等' : '困難';

  const handleGenerate = async () => {
    if (!settings.apiKey) { setError('先到設定填入 API Key，就可以開始生成題庫。'); return; }
    if (topic.trim().length < 5) { setError('再多貼一點內容吧（至少 5 個字）。'); return; }
    setLoading(true); setError(''); setStage('generating');
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
        setError('AI 生成的題目格式有問題，請再試一次\n' + result.errors.slice(0, 3).join('\n'));
        setStage('input');
        return;
      }
      // 題庫在生成成功時就交給 App，預覽只是視覺呈現，不能成為儲存的門檻。
      onGenerated(result.bank!);
      setGeneratedBank(result.bank!);
      setStage('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 生成失敗，請再試一次');
      setStage('input');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="visual-ai fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col justify-end">
      <div className="visual-ai-panel max-w-md mx-auto w-full bg-bg rounded-t-[2rem] max-h-[92vh] overflow-y-auto safe-top">
        <div className="visual-ai-header flex justify-between items-center">
          <div className="flex items-center gap-3">
            {stage === 'preview' && (
              <button onClick={() => setStage('input')} className="visual-ai-icon-button" aria-label="返回編輯"><ArrowLeft size={17} /></button>
            )}
            <div>
              <div className="visual-ai-kicker">AI 題庫工作室</div>
              <h2 className="text-xl font-black tracking-widest">{stage === 'preview' ? '預覽題目' : '把筆記變成題庫'}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-fg-dim text-sm tracking-widest">關閉</button>
        </div>

        <div className="visual-ai-steps" aria-label="生成步驟">
          {['貼上筆記', '設定選項', '預覽儲存'].map((label, index) => {
            const active = stage === 'preview' ? index === 2 : index < 2;
            return <div key={label} className={`visual-ai-step ${active ? 'is-active' : ''}`}><span>{index + 1}</span>{label}</div>;
          })}
        </div>

        {stage === 'generating' && (
          <div className="visual-ai-loading" role="status" aria-live="polite">
            <div className="visual-ai-ripple"><span /><span /><span /><Sparkles size={22} /></div>
            <h3>正在整理你的筆記</h3>
            <p>AI 會先抓出重點，再組成適合練習的題目。</p>
          </div>
        )}

        {stage === 'preview' && generatedBank ? (
          <div className="visual-ai-preview">
            <div className="visual-ai-preview-intro">
              <div><span className="visual-ai-kicker">已準備好</span><h3>{generatedBank.displayName}</h3></div>
              <span className="visual-ai-count">{generatedBank.questions.length} 題</span>
            </div>
            <div className="visual-ai-question-list">
              {generatedBank.questions.slice(0, 3).map((question, index) => (
                <article className="visual-ai-question-card" key={question.id}>
                  <div className="visual-ai-card-meta"><span>題目 {String(index + 1).padStart(2, '0')}</span><Check size={14} /></div>
                  <p>{question.question}</p>
                  {question.options.length > 0 && <div className="visual-ai-options">{question.options.slice(0, 2).map(option => <span key={option}>{option}</span>)}</div>}
                </article>
              ))}
            </div>
            <button onClick={onClose} className="visual-ai-hero-button w-full" data-testid="ai-save"><Save size={18} /> 已儲存，開始練習</button>
          </div>
        ) : stage !== 'generating' && (
          <div className="visual-ai-form">
            <div className="visual-ai-field-heading"><FileText size={15} /><label htmlFor="ai-topic">貼上你的筆記</label><span>{topic.length} / 5000</span></div>
            <textarea id="ai-topic" value={topic} onChange={e => setTopic(e.target.value.slice(0, 5000))} placeholder="貼上課堂筆記、文章，或輸入想複習的主題…" rows={8} maxLength={5000} />
            <div className="visual-ai-field-heading visual-ai-name-heading"><label htmlFor="ai-name">題庫名稱</label><span>選填</span></div>
            <input id="ai-name" value={name} onChange={e => setName(e.target.value)} placeholder="例如：生物細胞、英文片語" />

            <div className="visual-ai-options-block">
              <div className="visual-ai-field-heading"><span>生成選項</span><span>可至設定調整</span></div>
              <div className="visual-ai-chips"><span>{settings.genCount} 題</span><span>難度 · {difficulty}</span><span>{settings.provider.toUpperCase()}</span></div>
            </div>

            {error && <div className="visual-ai-error" role="alert"><p>{error}</p>{!settings.apiKey && <p>到右上角「設定」填入 API Key。</p>}</div>}
            {!settings.apiKey && !error && <p className="visual-ai-key-hint">還沒有 API Key？到右上角「設定」填入 API Key。</p>}

            <button onClick={handleGenerate} disabled={loading} className="visual-ai-hero-button w-full" data-testid="ai-generate"><Sparkles size={18} /> {loading ? '準備中…' : '生成題庫'} <ChevronRight size={17} /></button>
            <p className="visual-ai-footnote">內容只會從你的瀏覽器送往已選的 AI 供應商。</p>
          </div>
        )}
      </div>
    </div>
  );
};
