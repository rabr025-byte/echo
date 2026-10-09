/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // 顏色對應 CSS 變數(見 src/lib/themes.ts),切主題自動套用
      colors: {
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        'fg-dim': 'var(--fg-dim)',
        card: 'var(--card)',
        'theme-border': 'var(--border)',
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
        good: 'var(--good)',
        bad: 'var(--bad)',
        combo: 'var(--combo)',
      },
    },
  },
  plugins: [],
};
