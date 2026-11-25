// src/components/StatsPanel.tsx
// [Echo] 戰績面板 — 圖鑑矩陣(每題掌握度)+ 歷史紀錄排行
import { useState, useMemo } from 'react';
import type { QuestionBank } from '../types/bank';
import { loadStats, loadRecords } from '../lib/storage';
import { X } from 'lucide-react';
import '../styles/visual-stats.css';

interface Props {
  bank: QuestionBank;
  onClose: () => void;
}

const MODE_LABEL: Record<string, string> = {
  normal: '標準', hard: '進階', speed: '限時',
  sudden_death: '極限', mistake: '錯題', phantom: '幻影', essay: '申論',
};

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export const StatsPanel = ({ bank, onClose }: Props) => {
  const [tab, setTab] = useState<'matrix' | 'records'>('matrix');
  const stats = useMemo(() => loadStats(bank.bankId), [bank.bankId]);
  const records = useMemo(() => loadRecords(bank.bankId), [bank.bankId]);

  const total = bank.questions.length;
  const seen = bank.questions.filter(q => stats[q.id]).length;
  const coverage = total > 0 ? Math.round((seen / total) * 100) : 0;
  const mastered = bank.questions.filter(q => {
    const s = stats[q.id];
    return s && s.correct > 0 && s.wrong === 0;   // 答過且從沒錯 = 已掌握
  }).length;

  // 排行:依得分排序前 10
  const ranked = useMemo(
    () => [...records].sort((a, b) => b.points - a.points).slice(0, 10),
    [records]
  );

  return (
    <div className="stats-panel-visual fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col justify-end">
      <div className="stats-sheet max-w-md mx-auto w-full bg-bg p-6 pb-12 max-h-[88vh] overflow-y-auto safe-bottom">
        <div className="stats-heading flex justify-between items-start mb-5">
          <div>
            <div className="stats-kicker">圖鑑紀錄</div>
            <h2 className="text-2xl font-black tracking-widest">戰績</h2>
          </div>
          <button onClick={onClose} className="stats-close text-fg-dim" aria-label="關閉戰績"><X size={20} /></button>
        </div>

        {/* 分頁切換 */}
        <div className="stats-tabs flex gap-5 mb-6" role="tablist" aria-label="戰績分類">
          {([['matrix', '圖鑑'], ['records', '紀錄']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              role="tab" aria-selected={tab === id}
              className={`stats-tab text-xs font-bold tracking-widest transition-all ${tab === id ? 'is-active' : ''}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'matrix' && (
          <>
            {/* 概況 */}
            <div className="stats-hero mb-6">
              <div className="stats-kicker">已掌握題目</div>
              <div className="stats-hero-line">
                <div className="stats-hero-value">{mastered}<span> / {total}</span></div>
                <div className="stats-hero-percent">{total > 0 ? Math.round((mastered / total) * 100) : 0}%</div>
              </div>
              <div className="stats-progress" aria-label={`已掌握 ${mastered} 題，共 ${total} 題`}><span style={{ width: `${total > 0 ? (mastered / total) * 100 : 0}%` }} /></div>
              <div className="stats-hero-note">已作答 {coverage}%（{seen} 題）· 還有 {Math.max(0, total - seen)} 題等你解鎖</div>
            </div>

            {/* 以短條呈現題目狀態，保留每題 title 供查看詳情。 */}
            <div className="stats-question-strip" aria-label="題目掌握分布">
              {bank.questions.map((q, i) => {
                const s = stats[q.id];
                const status = !s ? 'unseen' : s.wrong === 0 ? 'mastered' : s.correct > s.wrong ? 'familiar' : 'review';
                return (
                  <div key={q.id} className={`stats-question-mark ${status}`}
                    title={`${q.question.slice(0, 20)}… ${s ? `對${s.correct}/錯${s.wrong}` : '未作答'}`}>
                    <span className="sr-only">第 {i + 1} 題</span>
                  </div>
                );
              })}
            </div>

            <div className="stats-legend flex flex-wrap gap-3 mt-4 text-[9px] text-fg-dim">
              {[
                ['已掌握', 'mastered'],
                ['熟悉中', 'familiar'],
                ['需複習', 'review'],
                ['未作答', 'unseen'],
              ].map(([label, c]) => (
                <span key={label} className="flex items-center gap-1">
                  <span className={`stats-legend-dot ${c}`} />
                  {label}
                </span>
              ))}
            </div>
          </>
        )}

        {tab === 'records' && (
          <div className="stats-records flex flex-col">
            {ranked.length === 0 && (
              <p className="text-fg-dim text-sm text-center py-8">還沒有紀錄,先玩一局吧</p>
            )}
            {ranked.map((r, i) => (
              <div key={i} className="stats-record stats-row flex items-center gap-3">
                <span className="stats-rank w-7 text-center font-black tabular-nums text-sm"
                  style={{ color: i < 3 ? 'var(--accent)' : 'var(--fg-dim)' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums">{r.points} 分</span>
                    <span className="stats-mode text-[9px] text-fg-dim">
                      {MODE_LABEL[r.mode] ?? r.mode}
                    </span>
                  </div>
                  <div className="text-fg-dim text-[10px] mt-0.5">
                    答對 {r.score}/{r.total} · {fmtTime(r.time)} · {r.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
