// src/components/StatsPanel.tsx
// [Echo] 戰績面板 — 圖鑑矩陣(每題掌握度)+ 歷史紀錄排行
import { useState, useMemo } from 'react';
import type { QuestionBank } from '../types/bank';
import { loadStats, loadRecords } from '../lib/storage';
import { X } from 'lucide-react';

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
  const mastered = bank.questions.filter(q => {
    const s = stats[q.id];
    return s && s.correct > 0 && s.wrong === 0;   // 答過且從沒錯 = 已掌握
  }).length;
  const coverage = total > 0 ? Math.round((seen / total) * 100) : 0;

  // 排行:依得分排序前 10
  const ranked = useMemo(
    () => [...records].sort((a, b) => b.points - a.points).slice(0, 10),
    [records]
  );

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col justify-end">
      <div className="max-w-md mx-auto w-full bg-bg border-t border-theme-border rounded-t-3xl p-6 pb-12 max-h-[88vh] overflow-y-auto safe-bottom">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold tracking-widest">戰績</h2>
          <button onClick={onClose} className="text-fg-dim"><X size={20} /></button>
        </div>

        {/* 分頁切換 */}
        <div className="flex gap-2 mb-5">
          {([['matrix', '圖鑑'], ['records', '紀錄']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-bold tracking-widest transition-all ${
                tab === id ? 'border-accent/50 bg-accent/10' : 'border-theme-border text-fg-dim'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'matrix' && (
          <>
            {/* 概況 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                ['題庫題數', total],
                ['已作答', `${coverage}%`],
                ['已掌握', mastered],
              ].map(([label, val]) => (
                <div key={label as string} className="p-3 rounded-xl bg-card border border-theme-border text-center">
                  <div className="text-fg-dim text-[9px] tracking-widest mb-1">{label}</div>
                  <div className="text-lg font-black tabular-nums">{val}</div>
                </div>
              ))}
            </div>

            {/* 圖鑑矩陣 */}
            <div className="grid grid-cols-8 gap-1.5">
              {bank.questions.map((q, i) => {
                const s = stats[q.id];
                let bg = 'transparent', border = 'var(--border)', color = 'var(--fg-dim)';
                if (s) {
                  if (s.wrong === 0) { bg = 'var(--good)'; border = 'var(--good)'; color = 'var(--bg)'; }
                  else if (s.correct > s.wrong) { bg = 'color-mix(in srgb, var(--combo) 35%, transparent)'; border = 'var(--combo)'; color = 'var(--fg)'; }
                  else { bg = 'color-mix(in srgb, var(--bad) 25%, transparent)'; border = 'var(--bad)'; color = 'var(--fg)'; }
                }
                return (
                  <div key={q.id}
                    className="aspect-square rounded-md flex items-center justify-center text-[8px] font-mono border"
                    style={{ background: bg, borderColor: border, color }}
                    title={`${q.question.slice(0, 20)}… ${s ? `對${s.correct}/錯${s.wrong}` : '未作答'}`}>
                    {i + 1}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 mt-4 text-[9px] text-fg-dim">
              {[
                ['全對', 'var(--good)'],
                ['對多於錯', 'var(--combo)'],
                ['常錯', 'var(--bad)'],
                ['未作答', 'var(--border)'],
              ].map(([label, c]) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm border" style={{ background: c, borderColor: c }} />
                  {label}
                </span>
              ))}
            </div>
          </>
        )}

        {tab === 'records' && (
          <div className="flex flex-col gap-2">
            {ranked.length === 0 && (
              <p className="text-fg-dim text-sm text-center py-8">還沒有紀錄,先玩一局吧</p>
            )}
            {ranked.map((r, i) => (
              <div key={i} className="p-3 rounded-xl bg-card border border-theme-border flex items-center gap-3">
                <span className="w-7 text-center font-black tabular-nums text-sm"
                  style={{ color: i < 3 ? 'var(--accent)' : 'var(--fg-dim)' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums">{r.points} 分</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-theme-border text-fg-dim">
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
