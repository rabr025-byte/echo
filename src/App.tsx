// src/App.tsx
// [Echo] v0.3 能玩版 — 選單 / 答題 / 結算 / 題庫切換
import { useEffect, useState, useMemo } from 'react';
import type { QuestionBank, Question } from './types/bank';
import { useGame, type Mode } from './lib/useGame';
import { loadMistakes } from './lib/storage';
import { loadSettings, saveSettings } from './lib/settings';
import type { AISettings } from './lib/ai/types';
import { getProvider } from './lib/ai';
import { explainPrompt } from './lib/ai/prompts';
import { Menu } from './components/Menu';
import { Quiz } from './components/Quiz';
import { Result } from './components/Result';
import { BankPicker } from './components/BankPicker';
import { Settings } from './components/Settings';

type View = 'loading' | 'menu' | 'quiz' | 'result';

export const App = () => {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState<View>('loading');
  const [showPicker, setShowPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AISettings>(loadSettings);
  const [mistakeCount, setMistakeCount] = useState(0);

  // 載入預設題庫
  useEffect(() => {
    fetch('/banks/ipas_bank.json')
      .then(r => { if (!r.ok) throw new Error(`載入失敗 (${r.status})`); return r.json(); })
      .then((data: QuestionBank) => { setBank(data); setView('menu'); })
      .catch(e => setLoadError(e.message));
  }, []);

  const title = bank ? `Echo · ${bank.displayName}` : 'Echo';
  useEffect(() => { document.title = title; }, [title]);

  // 錯題數(切題庫時更新)
  useEffect(() => {
    if (bank) setMistakeCount(loadMistakes(bank.bankId).length);
  }, [bank, view]);

  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <p className="text-red-400 text-sm">題庫載入失敗:{loadError}</p>
    </div>
  );
  if (!bank) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-parchment/40 text-sm animate-pulse">載入中…</p>
    </div>
  );

  return <GameShell
    bank={bank}
    view={view} setView={setView}
    showPicker={showPicker} setShowPicker={setShowPicker}
    showSettings={showSettings} setShowSettings={setShowSettings}
    settings={settings}
    onSaveSettings={(s) => { setSettings(s); saveSettings(s); }}
    mistakeCount={mistakeCount}
    onPickBank={(b) => { setBank(b); setShowPicker(false); setView('menu'); }}
  />;
};

// 把遊戲邏輯獨立成一層,確保 useGame 綁定當前 bank
function GameShell({
  bank, view, setView, showPicker, setShowPicker,
  showSettings, setShowSettings, settings, onSaveSettings,
  mistakeCount, onPickBank,
}: {
  bank: QuestionBank;
  view: View; setView: (v: View) => void;
  showPicker: boolean; setShowPicker: (b: boolean) => void;
  showSettings: boolean; setShowSettings: (b: boolean) => void;
  settings: AISettings; onSaveSettings: (s: AISettings) => void;
  mistakeCount: number;
  onPickBank: (b: QuestionBank) => void;
}) {
  const game = useGame(bank);
  const [toast, setToast] = useState('');

  // AI 詳解 handler(用當前 settings 的供應商與 key)
  const handleAiExplain = async (q: { question: string; options: string[]; answerText: string }) => {
    const provider = getProvider(settings.provider);
    const prompt = explainPrompt(q.question, q.options, q.answerText);
    return provider.generate(prompt, settings.apiKey);
  };

  const mistakeQuestions: Question[] = useMemo(() => {
    const ids = new Set(loadMistakes(bank.bankId).map(m => m.id));
    return bank.questions.filter(q => ids.has(q.id));
  }, [bank]);

  const handleStart = (m: Mode) => {
    const filters = { subject: null, category: null }; // 篩選 UI 待第五階段補
    const res = game.start(m, filters, m === 'mistake' ? mistakeQuestions : undefined);
    if (!res.ok) { setToast(res.msg ?? '無法開始'); setTimeout(() => setToast(''), 2000); return; }
    setView('quiz');
  };

  // 遊戲結束自動切到結算
  useEffect(() => {
    if (view === 'quiz' && game.finished) setView('result');
  }, [game.finished, view, setView]);

  return (
    <>
      {view === 'menu' && (
        <Menu bank={bank} mistakeCount={mistakeCount}
          onStart={handleStart}
          onOpenBankPicker={() => setShowPicker(true)}
          onOpenSettings={() => setShowSettings(true)} />
      )}
      {view === 'quiz' && (
        <Quiz game={game}
          onQuit={() => { game.quit(); setView('menu'); }}
          onAiExplain={settings.apiKey ? handleAiExplain : undefined} />
      )}
      {view === 'result' && (
        <Result game={game}
          onReplay={() => { handleStart(game.mode); }}
          onMenu={() => { game.quit(); setView('menu'); }} />
      )}

      {showPicker && (
        <BankPicker current={bank} onPick={onPickBank} onClose={() => setShowPicker(false)} />
      )}

      {showSettings && (
        <Settings settings={settings} onSave={onSaveSettings} onClose={() => setShowSettings(false)} />
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl bg-parchment text-ink text-sm font-bold tracking-widest z-50">
          {toast}
        </div>
      )}
    </>
  );
}
