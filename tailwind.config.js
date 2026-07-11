/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Echo 色彩系統之後在第五階段(UI 重建)正式定案,先放基礎值
      colors: {
        ink: '#0d0f12',       // 主背景
        parchment: '#e8e2d6', // 主文字
      },
    },
  },
  plugins: [],
};
