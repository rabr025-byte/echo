// src/components/StreakCalendar.tsx
// [Echo] 連續登入月曆 — 移植播種計畫驗證過的設計:
// 已登入金色實心+光暈遞增、今天呼吸燈、明天淡輪廓(缺口心理學)、月進度條
import type { StreakData } from '../lib/streak';

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
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-xs bg-bg border border-theme-border rounded-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* 連續天數 */}
        <div className="text-center mb-5">
          <div className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-1">連續登入</div>
          <div className="text-5xl font-black tabular-nums" style={{ color: 'var(--accent)', textShadow: '0 0 20px color-mix(in srgb, var(--accent) 50%, transparent)' }}>
            {streak.current}<span className="text-lg ml-1">天</span>
          </div>
          <div className="text-fg-dim text-[10px] mt-1">最佳紀錄 {streak.best} 天</div>
        </div>

        {/* 本月進度 */}
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[9px] text-fg-dim tracking-widest">{month + 1} 月</span>
          <span className="text-[9px] font-mono" style={{ color: 'var(--accent)' }}>{monthCount} / {daysInMonth} 天</span>
        </div>
        <div className="w-full h-1 bg-card rounded-full mb-4 overflow-hidden">
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
            const daysAgo = Math.max(0, Math.floor((new Date(todayStr).getTime() - new Date(dateStr).getTime()) / 86400000));
            const glow = hasLogin ? Math.max(0.25, 1 - daysAgo * 0.08) : 0;

            return (
              <div key={i} className="flex items-center justify-center">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-mono transition-all"
                  style={{
                    ...(isToday && hasLogin ? {
                      background: 'var(--accent)', color: 'var(--accent-fg)', fontWeight: 700,
                      boxShadow: `0 0 12px color-mix(in srgb, var(--accent) 70%, transparent)`,
                      animation: 'heartPanic 2s ease-in-out infinite',
                    } : isToday ? {
                      border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700,
                      animation: 'heartPanic 2s ease-in-out infinite',
                    } : hasLogin ? {
                      background: 'var(--accent)', color: 'var(--accent-fg)', fontWeight: 700,
                      boxShadow: `0 0 ${Math.round(glow * 10)}px color-mix(in srgb, var(--accent) ${Math.round(glow * 100)}%, transparent)`,
                    } : isTomorrow ? {
                      border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', color: 'var(--fg-dim)',
                    } : isPast ? {
                      border: '1px solid var(--border)', color: 'var(--fg-dim)', opacity: 0.4,
                    } : { color: 'var(--fg-dim)', opacity: 0.5 }),
                  }}>
                  {day}
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
