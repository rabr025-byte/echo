// src/App.tsx
// [Echo] v0.3 能玩版 — 選單 / 答題 / 結算 / 題庫切換
import { useEffect, useState, useMemo } from 'react';
import type { QuestionBank, Question } from './types/bank';
import { useGame, type Mode } from './lib/useGame';
import { loadMistakes } from './lib/storage';
import { loadSettings, saveSettings } from './lib/settings';
import { applyTheme } from './lib/themes';
import { checkInToday, type StreakData } from './lib/streak';
import { StreakCalendar } from './components/StreakCalendar';
import { Tutorial, isTutorialDone } from './components/Tutorial';
import { BankGuide } from './components/BankGuide';
import { StatsPanel } from './components/StatsPanel';
import { loadBanks, getActiveBankId, setActiveBankId } from './lib/bankStore';
import type { AISettings } from './lib/ai/types';
import { getProvider } from './lib/ai';
import { explainPrompt, phantomPrompt, gradeEssayPrompt } from './lib/ai/prompts';
import { validateBank } from './lib/validateBank';
import { Menu } from './components/Menu';
import { Quiz } from './components/Quiz';
import { Result } from './components/Result';
import { BankPicker } from './components/BankPicker';
import { Settings } from './components/Settings';
import { AiGenerate } from './components/AiGenerate';

type View = 'loading' | 'menu' | 'quiz' | 'result';

export const App = () => {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [defaultBank, setDefaultBank] = useState<QuestionBank | null>(null);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState<View>('loading');
  const [showPicker, setShowPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AISettings>(loadSettings);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [showStreak, setShowStreak] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // 首次開啟且題庫載入完成 → 啟動導引
  useEffect(() => {
    if (bank && view === 'menu' && !isTutorialDone()) setShowTutorial(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank, view]);

  // 每天首次打開記錄登入
  useEffect(() => {
    const { data } = checkInToday();
    setStreak(data);
  }, []);

  // 套用主題(載入時 + 主題變更時)
  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);

  // 載入預設題庫
  useEffect(() => {
    fetch('/banks/ipas_bank.json')
      .then(r => { if (!r.ok) throw new Error(`載入失敗 (${r.status})`); return r.json(); })
      .then((data: QuestionBank) => {
        setDefaultBank(data);
        // 若上次用的是自己上傳的題庫,自動還原
        const activeId = getActiveBankId();
        const savedBank = activeId ? loadBanks().find(b => b.bankId === activeId) : null;
        setBank(savedBank ?? data);
        setView('menu');
      })
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
      <p className="text-bad text-sm">題庫載入失敗:{loadError}</p>
    </div>
  );
  if (!bank) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-fg-dim text-sm animate-pulse">載入中…</p>
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
    showTutorial={showTutorial} onTutorialDone={() => setShowTutorial(false)}
    streak={streak}
    showStreak={showStreak} setShowStreak={setShowStreak}
    defaultBank={defaultBank}
    onPickBank={(b) => { setBank(b); setActiveBankId(b.bankId); setShowPicker(false); setView('menu'); }}
  />;
};

// 把遊戲邏輯獨立成一層,確保 useGame 綁定當前 bank
function GameShell({
  bank, view, setView, showPicker, setShowPicker,
  showSettings, setShowSettings, settings, onSaveSettings,
  mistakeCount, showTutorial, onTutorialDone, streak, showStreak, setShowStreak,
  defaultBank, onPickBank,
}: {
  bank: QuestionBank;
  view: View; setView: (v: View) => void;
  showPicker: boolean; setShowPicker: (b: boolean) => void;
  showSettings: boolean; setShowSettings: (b: boolean) => void;
  settings: AISettings; onSaveSettings: (s: AISettings) => void;
  mistakeCount: number;
  showTutorial: boolean; onTutorialDone: () => void;
  streak: StreakData | null;
  showStreak: boolean; setShowStreak: (b: boolean) => void;
  defaultBank: QuestionBank | null;
  onPickBank: (b: QuestionBank) => void;
}) {
  const game = useGame(bank);
  const [toast, setToast] = useState('');
  const [showGen, setShowGen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [phantomLoading, setPhantomLoading] = useState(false);

  // AI 詳解 handler
  const handleAiExplain = async (q: { question: string; options: string[]; answerText: string }) => {
    const provider = getProvider(settings.provider);
    const prompt = explainPrompt(q.question, q.options, q.answerText);
    return provider.generate(prompt, settings.apiKey);
  };

  // 申論題 AI 評分 handler
  const handleGradeEssay = async (q: { question: string; rubric: string; userAnswer: string }) => {
    const provider = getProvider(settings.provider);
    const raw = await provider.generate(gradeEssayPrompt(q.question, q.rubric, q.userAnswer), settings.apiKey);
    let t = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    const s2 = t.indexOf('{'), e2 = t.lastIndexOf('}');
    if (s2 >= 0 && e2 > s2) t = t.slice(s2, e2 + 1);
    const parsed = JSON.parse(t) as { score?: unknown; comment?: unknown };
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score))));
    if (Number.isNaN(score)) throw new Error('AI 評分格式錯誤,請再試一次');
    return { score, comment: String(parsed.comment ?? '') };
  };

  const mistakeQuestions: Question[] = useMemo(() => {
    const ids = new Set(loadMistakes(bank.bankId).map(m => m.id));
    return bank.questions.filter(q => ids.has(q.id));
  }, [bank]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const handleStart = (m: Mode) => {
    if (m === 'phantom') { handlePhantom(); return; }
    if (m === 'essay' && !settings.apiKey) { showToast('申論題需要 AI 評分,請先到設定填入 API Key'); return; }
    const filters = { subject: null, category: null }; // 篩選 UI 待第五階段補
    const res = game.start(m, filters, m === 'mistake' ? mistakeQuestions : undefined);
    if (!res.ok) { showToast(res.msg ?? '無法開始'); return; }
    setView('quiz');
  };

  // AI 幻影:即時生一題來考
  const handlePhantom = async () => {
    if (!settings.apiKey) { showToast('請先到設定填入 API Key'); return; }
    setPhantomLoading(true);
    try {
      const provider = getProvider(settings.provider);
      const raw = await provider.generate(phantomPrompt(bank.displayName, settings.genDifficulty), settings.apiKey);
      let t = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
      const s = t.indexOf('{'), e = t.lastIndexOf('}');
      if (s >= 0 && e > s) t = t.slice(s, e + 1);
      const q = JSON.parse(t);
      const bankCheck = validateBank({ bankId: 'phantom', displayName: 'x', name: 'x', questions: [q] });
      if (!bankCheck.ok) { showToast('AI 生題失敗,請再試一次'); return; }
      const res = game.start('phantom', { subject: null, category: null }, [q]);
      if (!res.ok) { showToast(res.msg ?? '無法開始'); return; }
      setView('quiz');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'AI 生題失敗');
    } finally {
      setPhantomLoading(false);
    }
  };

  // 遊戲結束自動切到結算
  useEffect(() => {
    if (view === 'quiz' && game.finished) setView('result');
  }, [game.finished, view, setView]);

  return (
    <>
      {view === 'menu' && (
        <Menu bank={bank} mistakeCount={mistakeCount}
          hasApiKey={!!settings.apiKey}
          phantomLoading={phantomLoading}
          streakDays={streak?.current ?? 0}
          onOpenStreak={() => setShowStreak(true)}
          essayCount={bank.questions.filter(q => q.type === 'essay').length}
          onOpenStats={() => setShowStats(true)}
          onStart={handleStart}
          onOpenBankPicker={() => setShowPicker(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenAiGenerate={() => setShowGen(true)} />
      )}
      {view === 'quiz' && (
        <Quiz game={game}
          onQuit={() => { game.quit(); setView('menu'); }}
          onAiExplain={settings.apiKey ? handleAiExplain : undefined}
          onGradeEssay={settings.apiKey ? handleGradeEssay : undefined}
          devMode={settings.devMode} />
      )}
      {view === 'result' && (
        <Result game={game}
          onReplay={() => { handleStart(game.mode); }}
          onMenu={() => { game.quit(); setView('menu'); }} />
      )}

      {showPicker && (
        <BankPicker current={bank} defaultBank={defaultBank} onPick={onPickBank} onClose={() => setShowPicker(false)} />
      )}

      {showSettings && (
        <Settings settings={settings} onSave={onSaveSettings} onClose={() => setShowSettings(false)}
          onOpenGuide={() => setShowGuide(true)} />
      )}

      {showTutorial && <Tutorial onDone={onTutorialDone} />}

      {showStreak && streak && (
        <StreakCalendar streak={streak} onClose={() => setShowStreak(false)} />
      )}

      {showGuide && <BankGuide onClose={() => setShowGuide(false)} />}

      {showStats && <StatsPanel bank={bank} onClose={() => setShowStats(false)} />}

      {showGen && (
        <AiGenerate settings={settings}
          onGenerated={(b) => { setShowGen(false); onPickBank(b); }}
          onClose={() => setShowGen(false)} />
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl bg-accent text-accent-fg text-sm font-bold tracking-widest z-50">
          {toast}
        </div>
      )}
    </>
  );
}
