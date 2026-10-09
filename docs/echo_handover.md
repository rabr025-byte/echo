# Echo — 通用刷題遊戲引擎 · 交接規格書 v1.0.1

> 建立日期:2026-07　·　最後更新:2026-08-03

> 這份文件讓接手者能完全理解並復刻 Echo。先讀本文件掌握全貌,再對照原始碼。Echo 的完整專案在 zip 檔中(`echo-v0.9.1.zip`),本文件是它的地圖與設計說明。

---

## 0. 一句話定位

Echo 是一個**通用刷題遊戲引擎**:核心是遊戲外殼(多巴胺回饋、連擊、血量、留存系統),題庫是可替換的資料。使用者可用預設題庫、上傳自己的 JSON、或用 AI 生成題庫。不綁定任何特定考試領域。

---

## 1. 技術棧與專案資訊

- **框架**:React 18 + TypeScript + Vite
- **樣式**:Tailwind CSS(顏色全用 CSS 變數,支援主題切換)
- **圖示**:lucide-react(不用 emoji,避免廉價感)
- **AI**:Gemini API(從瀏覽器直接呼叫,可擴充其他供應商)
- **部署**:Vercel(新 repo,建議名 echo)
- **本機路徑**:~/Desktop/echo
- **開發者**:童俊諺(S.T. 童 / JYen.Sam)
- **前身**:去年 12 月的「IPAS 戰情室」單檔 HTML(244KB,React+Babel CDN 土法煉鋼版),Echo 是它的模組化重構 + 通用化。

---

## 2. 完整檔案結構

```
project/
├── index.html                     # viewport-fit=cover(iOS 安全區)
├── package.json / vite.config.ts / tsconfig.json
├── tailwind.config.js             # 顏色映射 CSS 變數
├── postcss.config.js
├── docs/behavior-spec.md          # 遊戲行為清單(驗收標準)
├── public/banks/ipas_bank.json    # 預設題庫(323 題,見第 6 節)
└── src/
    ├── main.tsx                   # 進入點
    ├── index.css                  # 主題變數 + 全部動畫 keyframes + safe-area
    ├── App.tsx                    # 主控:載題庫、狀態、串接所有畫面
    ├── types/bank.ts              # 題庫型別(通用格式核心)
    ├── lib/
    │   ├── useGame.ts             # ★遊戲核心邏輯(出題/答題/combo/HP/計分/幽靈/每日)
    │   ├── storage.ts             # 多題庫進度隔離(stats/mistakes/records)
    │   ├── validateBank.ts        # 題庫驗證器(上傳時檢查,人話錯誤)
    │   ├── themes.ts              # 三主題定義 + applyTheme
    │   ├── settings.ts            # 設定存取
    │   ├── streak.ts              # 連續登入系統
    │   ├── daily.ts               # 每日任務系統
    │   ├── ghost.ts               # 幽靈對手(跟過去的自己賽跑)
    │   └── ai/
    │       ├── types.ts           # AISettings 型別 + 預設值
    │       ├── gemini.ts          # Gemini 供應商實作
    │       ├── index.ts           # 供應商註冊表(可擴充)
    │       └── prompts.ts         # 所有 AI 提示詞(解讀/生題/幻影/評分)
    └── components/
        ├── Menu.tsx               # 主選單(模式選擇、留存資訊、AI 入口)
        ├── Quiz.tsx               # ★答題畫面(選擇+申論、所有爽感特效)
        ├── Result.tsx             # 結算(分級慶祝、破紀錄、任務達成)
        ├── BankPicker.tsx         # 題庫選擇/上傳
        ├── Settings.tsx           # 設定頁(主題、AI、開關)
        ├── AiGenerate.tsx         # AI 生成題庫
        ├── StreakCalendar.tsx     # 連續登入月曆
        └── Tutorial.tsx           # 首次互動導覽
```

★ = 最核心、改動最需謹慎的檔案。

---

## 3. 題庫格式(通用版的核心設計)

`src/types/bank.ts`:

```ts
interface Question {
  id: string;                    // 題庫內唯一
  type?: 'choice' | 'essay';     // 題型,預設 choice
  question: string;
  options: string[];             // 選擇題必填≥2;申論題填 []
  answer: number;                // 選擇題正解索引(0起);申論填 0
  rubric?: string;               // 申論題評分要點(給 AI 評分標準)
  explanation?: string;          // 詳解(選填)
  source?: string;               // 出處(選填)
  subject?: number;              // 科目編號(選填,篩選用)
  category?: number;             // 分類編號(選填,篩選用)
}

interface QuestionBank {
  bankId: string;        // ★題庫唯一識別碼,進度隔離用,不同題庫絕不可相同
  displayName: string;   // 動態標題會顯示「Echo · {displayName}」
  name: string;
  author?: string;
  description?: string;
  questions: Question[];
}
```

**動態標題設計**:沒載題庫顯示 `Echo`,載了顯示 `Echo · {displayName}`。引擎名固定,後面接「這次在刷什麼」。

---

## 4. 遊戲邏輯(useGame.ts)— 最核心

**模式 Mode**:`normal`(10題)/ `hard`(50題)/ `speed`(限時,答對自動跳)/ `sudden_death`(答錯即死)/ `mistake`(錯題本)/ `phantom`(AI即時生1題)/ `essay`(申論,AI評分)。

**計分**:答對 = `100 + min(combo×10, 500)`,賭注模式再 ×2。

**HP**:滿血 100,答錯 -20(可錯 5 次 = 5 顆愛心),賭注答錯 -40。歸零結束。

**combo**:答對 +1,答錯歸零。每 5 連觸發 `comboBurst`(里程碑信號,Quiz 監聽放閃光粒子)。

**幽靈**:每局記錄「每題答完的累計秒數」,存成該模式最佳紀錄。下次同模式答題,依經過時間推算「上次的你」進度,顯示領先/落後。錯題與幻影模式不比幽靈。

**每日任務**:答對/5連/完成場次 三個事件推進任務進度。

**申論**:`essayResolve(score)`,AI 評 0-100 分,≥60 通過接回 combo/計分(按分數比例),<60 扣心。

---

## 5. 視覺系統

**主題(themes.ts)**:三個主題用 CSS 變數,切換只換變數不動元件。
- `midnight` 暗夜(主力):黑底暖金,適度光暈
- `paper` 紙感:Kinfolk 風,溫潤米色紙、陶土色、無光暈
- `neon` 霓虹:紫黑底洋紅/青,強光暈,多巴胺最強

CSS 變數:`--bg --fg --fg-dim --card --border --accent --accent-fg --good --bad --combo --glow`。Tailwind 類別(`bg-bg text-fg bg-accent text-good` 等)映射到這些變數。

**多巴胺哲學**(與開發者另一專案「播種計畫」一致):平常克制,觸發時爆發。答對→綠光脈衝+分數爆字+combo大字彈出;5連→閃光+24粒子+光環;答錯→震動+紅光+愛心碎裂;結算→依成績分級慶祝(100%/80%/60% 不同粒子量)。

**動畫**:全部 keyframes 定義在 `src/index.css`(floatUp/burstUp/comboSmash/ringExpand/heartBreak/hitPulse 等)。

---

## 6. 預設題庫

`public/banks/echo_sample.json` = 原創範例題庫,**19 題**(16 選擇 + 3 申論,主題為科技常識與邏輯思考)。v1.0.1 起已將原本的 IPAS 題庫替換為此原創題庫,移除版權疑慮。

✅ **版權狀態**:v1.0.1 已將預設題庫改為原創範例,可安全公開。原 323 題 IPAS 題庫已從 repo 移除;若自用需要,可私下透過上傳功能載入(不放進公開 repo 即無散布問題)。

---

## 7. AI 架構(各自填 key)

**設計決策**:使用者各自填自己的 Gemini API Key(存本機 localStorage),從瀏覽器直接呼叫 Gemini,開發者不用做後端、不用付費。設定頁明確告知「Key 僅存本機不上傳」。

**供應商可擴充**:`ai/index.ts` 是註冊表,未來加 OpenAI/Claude 只要新增一個實作 `AIProvider` 介面的檔案,其他不用改。

**四個 AI 功能**:
- AI 解讀:答題後解釋這題
- AI 幻影:即時生 1 題考你
- AI 生成題庫:貼筆記→生整套題庫(採用門檻殺手,JSON 容錯處理 AI 亂包 markdown)
- 申論評分:依 rubric 給 0-100 分+短評

所有 prompt 集中在 `ai/prompts.ts`。

---

## 8. 留存系統(手遊套路,健康向)

- **連續登入**(streak.ts + StreakCalendar):每天首開記錄,選單顯示火焰天數,點開月曆熱力圖(已登入金點光暈遞增、今天呼吸燈、明天淡輪廓的缺口心理學、月進度條)
- **每日任務**(daily.ts):每天 3 目標,選單顯示進度,全完成結算慶祝
- **幽靈對手**(ghost.ts):跟過去的自己賽跑,破紀錄有徽章
- **賭注模式**:答題前可押,分數×2 但答錯扣雙倍心
- **互動導覽**(Tutorial.tsx):首次開啟聚光燈式教學(詳見另一份「互動導覽教學_實作說明.md」)

刻意**不做**的垃圾套路:體力限制、轉蛋、FOMO 倒數、推播轟炸。

---

## 9. localStorage key 一覽

- `echo:{bankId}:stats` — 每題對錯次數
- `echo:{bankId}:mistakes` — 錯題本
- `echo:{bankId}:records` — 歷史紀錄
- `echo:{bankId}:ghost:{mode}` — 幽靈最佳紀錄
- `echo:settings` — 主題/AI/開關設定
- `echo:streak` — 連續登入
- `echo:daily` — 每日任務
- `echo:tutorial_done` — 導覽看過旗標

★ 進度全部綁 bankId,換題庫互不污染。這是通用化的關鍵設計,改任何進度讀寫都要維持隔離。

---

## 10. 協作慣例(開發者偏好)

1. 每次改完附 git 推送指令,commit message 帶版本號:`git add . && git commit -m "vX.Y.Z 說明" && git push`
2. 程式碼加繁體中文註解,關鍵可調參數標明
3. 用 str_replace 局部修改優先,非必要不整檔重寫
4. 改動小給片段、改動大或多檔給整包 zip 覆蓋
5. 每個交付前實測:`npx tsc -b && vite build` 必須通過
6. 版本號:v0.x 開發期,六階段完成後上線改 v1.0

---

## 11. 六階段開發史(已全部完成)

1. 骨架(Vite 環境)
2. 題庫模組化(驗證器、多題庫隔離、上傳)
3. 遊戲邏輯(四模式、combo、HP、錯題本)
4. AI(設定頁、解讀、幻影、生題庫)
5. UI/多巴胺(主題切換、選單改版、答題爽感、愛心、打擊感)
6. 收尾(連續登入、每日任務、幽靈、賭注、導覽、申論、Kinfolk 紙感、lucide 圖示、iOS 安全區)

---

## 12. 已知待辦 / 未來方向

- **版權**(第 6 節):推廣前預設題庫改原創
- **電腦版 RWD**:目前手機優先置中窄欄,若要利用寬螢幕需另做(受眾多為手機,優先度低)
- **音效**:目前無,接口可仿播種計畫用 Web Audio 合成或放音檔
- **AI 生題庫產出申論題**:prompt 可再優化讓生成更穩定
- **成就牆 / XP / 目標設定**:留存系統可再擴充(評估過,功能已夠,實用一陣子再決定)

---

## 13. 交接包清單(要給下一位的東西)

- 本文件 `echo_handover.md`
- `互動導覽教學_實作說明.md`(導覽技術細節)
- `echo-v0.9.1.zip`(完整專案,最新版)
- `docs/behavior-spec.md`(在 zip 內,遊戲行為驗收標準)

接手者拿到 zip 解壓、`npm install`、`npm run dev` 即可跑起來,對照本文件理解全貌。
