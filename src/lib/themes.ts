// src/lib/themes.ts
// [Echo] 主題系統 — 用 CSS 變數,切主題只換變數值,元件不用改
// 三個主題:暗夜(沉穩專注)、紙感(乾淨考卷)、霓虹(遊戲多巴胺)

export type ThemeId = 'midnight' | 'paper' | 'neon';

export interface Theme {
  id: ThemeId;
  name: string;
  vars: Record<string, string>;
}

// CSS 變數說明:
// --bg 背景 / --fg 主文字 / --fg-dim 次要文字
// --card 卡片底 / --border 邊框
// --accent 重點色(按鈕、進度) / --accent-fg 重點色上的文字
// --good 答對 / --bad 答錯 / --combo 連擊色
// --glow 光暈強度(0=無,1=強)

export const THEMES: Record<ThemeId, Theme> = {
  midnight: {
    id: 'midnight',
    name: '暗夜',
    vars: {
      '--bg': '#0d0f12',
      '--fg': '#e8e2d6',
      '--fg-dim': 'rgba(232,226,214,0.45)',
      '--card': 'rgba(232,226,214,0.04)',
      '--border': 'rgba(232,226,214,0.12)',
      '--accent': '#d4af37',
      '--accent-fg': '#0d0f12',
      '--good': '#34d399',
      '--bad': '#f87171',
      '--combo': '#fbbf24',
      '--glow': '0.5',
    },
  },
  paper: {
    id: 'paper',
    name: '紙感',
    // Kinfolk 方向:溫潤米色紙質、墨色柔和、陶土色點綴、無光暈
    vars: {
      '--bg': '#efe9dd',                      // 米色紙,不死白
      '--fg': '#3d3833',                      // 柔和暖墨,不用純黑
      '--fg-dim': 'rgba(61,56,51,0.55)',
      '--card': 'rgba(61,56,51,0.045)',
      '--border': 'rgba(61,56,51,0.14)',
      '--accent': '#a05e45',                  // 陶土色,沉穩溫暖
      '--accent-fg': '#f5f0e6',
      '--good': '#6b7f5e',                    // 橄欖綠,低飽和
      '--bad': '#a3554a',                     // 磚陶紅,不刺眼
      '--combo': '#b8863f',                   // 舊金,溫潤
      '--glow': '0',
    },
  },
  neon: {
    id: 'neon',
    name: '霓虹',
    vars: {
      '--bg': '#0a0118',
      '--fg': '#f0e9ff',
      '--fg-dim': 'rgba(240,233,255,0.5)',
      '--card': 'rgba(168,85,247,0.08)',
      '--border': 'rgba(168,85,247,0.3)',
      '--accent': '#e879f9',
      '--accent-fg': '#0a0118',
      '--good': '#4ade80',
      '--bad': '#fb7185',
      '--combo': '#22d3ee',
      '--glow': '1',
    },
  },
};

export function applyTheme(id: ThemeId) {
  const theme = THEMES[id] ?? THEMES.midnight;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
