// src/lib/useGame.ts
// [Echo] 遊戲核心邏輯 — 依 docs/behavior-spec.md 實作
// 計分:答對 100 + min(combo×10, 500);答錯 HP-20、combo 歸零

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Question, QuestionBank } from '../types/bank';
import { saveStat, addMistake, addRecord } from './storage';

export type Mode = 'normal' | 'hard' | 'speed' | 'sudden_death' | 'mistake' | 'phantom';

export interface FloatText { id: number; x: number; y: number; text: string; kind: 'good' | 'bad'; }

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const HP_MAX = 100;
const HP_LOSS = 20;          // 每次答錯扣血(可錯 5 次)
const BASE_POINTS = 100;
const COMBO_STEP = 10;
const COMBO_CAP = 500;

export function useGame(bank: QuestionBank) {
  const [mode, setMode] = useState<Mode>('normal');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(HP_MAX);
  const [combo, setCombo] = useState(0);
  const [points, setPoints] = useState(0);
  const [timer, setTimer] = useState(0);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [shake, setShake] = useState(false);
  const [finished, setFinished] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  // 計時器
  useEffect(() => {
    if (startedRef.current && !finished) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [finished]);

  const buildPool = useCallback((filters: { subject: number | null; category: number | null }) => {
    let pool = [...bank.questions];
    if (filters.subject !== null) pool = pool.filter(q => q.subject === filters.subject);
    if (filters.category !== null) pool = pool.filter(q => q.category === filters.category);
    return pool;
  }, [bank]);

  const start = useCallback((
    m: Mode,
    filters: { subject: number | null; category: number | null },
    externalQuestions?: Question[],
  ) => {
    let qs: Question[];
    if (m === 'mistake') {
      qs = shuffle(externalQuestions ?? []);
    } else if (m === 'phantom') {
      // AI 幻影:題目由外部(AI)提供
      qs = externalQuestions ?? [];
    } else {
      const pool = buildPool(filters);
      if (pool.length === 0) return { ok: false, msg: '這個分類沒有題目' };
      if (m === 'speed') qs = pool; // 限時:全部照順序
      else if (m === 'sudden_death') qs = shuffle(pool);
      else {
        const count = m === 'hard' ? 50 : 10;
        qs = shuffle(pool).slice(0, count);
      }
    }
    if (qs.length === 0) return { ok: false, msg: '沒有可用的題目' };

    setMode(m); setQuestions(qs);
    setCurrentIdx(0); setSelected(null); setAnswered(false);
    setScore(0); setHp(HP_MAX); setCombo(0); setPoints(0);
    setTimer(0); setFloats([]); setFinished(false);
    startedRef.current = true;
    return { ok: true };
  }, [buildPool]);

  const pushFloat = (x: number, y: number, text: string, kind: 'good' | 'bad') => {
    const id = Date.now() + Math.random();
    setFloats(prev => [...prev, { id, x, y, text, kind }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1000);
  };

  const finish = useCallback((finalScore: number, total: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    startedRef.current = false;
    setFinished(true);
    addRecord(bank.bankId, {
      date: new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      score: finalScore, total, mode, time: timer, points,
    });
  }, [bank.bankId, mode, timer, points]);

  const answer = useCallback((idx: number, x: number, y: number) => {
    if (answered) return;
    const q = questions[currentIdx];
    const correct = idx === q.answer;
    setSelected(idx); setAnswered(true);
    saveStat(bank.bankId, q.id, correct);

    if (navigator.vibrate) navigator.vibrate(correct ? 30 : [50, 50, 50]);

    if (correct) {
      const bonus = Math.min(combo * COMBO_STEP, COMBO_CAP);
      const pts = BASE_POINTS + bonus;
      setScore(s => s + 1);
      setPoints(p => p + pts);
      setCombo(c => c + 1);
      pushFloat(x, y, `+${pts}`, 'good');
      if (mode === 'speed') setTimeout(() => next(), 400);
    } else {
      setCombo(0);
      pushFloat(x, y, `-${HP_LOSS}% HP`, 'bad');
      setShake(true); setTimeout(() => setShake(false), 500);
      addMistake(bank.bankId, q.id);
      setHp(prev => {
        const nhp = prev - HP_LOSS;
        if (nhp <= 0) setTimeout(() => finish(score, questions.length), 1000);
        return nhp;
      });
      if (mode === 'sudden_death') setTimeout(() => finish(score, currentIdx + 1), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, questions, currentIdx, combo, mode, bank.bankId, score]);

  const next = useCallback(() => {
    if (hp <= 0) return finish(score, questions.length);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(c => c + 1); setAnswered(false); setSelected(null);
    } else {
      finish(mode === 'sudden_death' ? score : score, questions.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hp, currentIdx, questions.length, score, mode]);

  const quit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startedRef.current = false;
    setFinished(false);
    setQuestions([]);
  }, []);

  return {
    mode, questions, currentIdx, selected, answered,
    score, hp, combo, points, timer, floats, shake, finished,
    current: questions[currentIdx],
    start, answer, next, quit,
    HP_MAX,
  };
}
