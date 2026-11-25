// src/components/StreakCalendar.tsx
// [Echo] 連續登入月曆 — 移植播種計畫驗證過的設計:
// 已登入金色實心+光暈遞增、今天呼吸燈、明天淡輪廓(缺口心理學)、月進度條
import type { StreakData } from '../lib/streak';
import { Flame } from 'lucide-react';
import '../styles/visual-stats.css';

interface Props {
  streak: StreakData;
  onClose: () => void;
}

export const StreakCalendar = ({ streak, onClose }: Props) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const loginSet = new Set(streak.days);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthCount = streak.days.filter(d => d.startsWith(monthPrefix)).length;

  return (
    <div className="streak-calendar-visual fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="streak-sheet w-full max-w-xs bg-bg p-6"
        onClick={e => e.stopPropagation()}>
        {/* 連續天數 */}
        <div className="text-center mb-5">
          <div className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-1">連續登入</div>
          <div className="streak-hero-value text-5xl font-black tabular-nums">
            <Flame size={25} strokeWidth={1.8} aria-hidden="true" />
            {streak.current}<span className="text-lg ml-1">天</span>
          </div>
          <div className="text-fg-dim text-[10px] mt-1">最佳紀錄 {streak.best} 天</div>
        </div>

        {/* 本月進度 */}
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[9px] text-fg-dim tracking-widest">{month + 1} 月</span>
          <span className="text-[9px] font-mono" style={{ color: 'var(--accent)' }}>{monthCount} / {daysInMonth} 天</span>
        </div>
        <div className="streak-progress w-full h-1 bg-card rounded-full mb-4 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(monthCount / daysInMonth) * 100}%`, background: 'var(--accent)' }} />
        </div>

        {/* 星期標頭 */}
        <div className="grid grid-cols-7 mb-1">
          {['日','一','二','三','四','五','六'].map(d => (
            <div key={d} className="text-[8px] text-fg-dim text-center">{d}</div>
          ))}
        </div>

        {/* 日期格 */}
        <div className="grid grid-cols-7 gap-y-1.5">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isTomorrow = dateStr === tomorrowStr;
            const hasLogin = loginSet.has(dateStr);
            const isPast = dateStr < todayStr;

            return (
                <div key={i} className="streak-day-wrap flex items-center justify-center">
                <div className={`streak-day ${hasLogin ? 'is-active' : ''} ${isToday ? 'is-today' : ''} ${isTomorrow ? 'is-tomorrow' : ''} ${isPast && !hasLogin ? 'is-past' : ''}`}
                  >
                  {day}
                  {hasLogin && <span className="streak-day-mark" aria-hidden="true" />}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[9px] text-fg-dim tracking-widest text-center mt-4">點擊外側關閉</p>
      </div>
    </div>
  );
};
