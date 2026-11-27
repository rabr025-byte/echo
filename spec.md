# Echo 規格書

最後更新：2026-11-26
依據：實際檢查 ~/Desktop/echo 資料夾的程式碼與 v1.1.4–v1.1.8 提交；工作樹包含 v1.1.9 的 smoke test 與互動修正

---

## 一、這是什麼

Echo 是一個「通用刷題遊戲」。遊戲本身固定，題庫可以換。
前身是 2025 年底的單檔 HTML「IPAS 戰情室」，後來重寫成現在這個專案。

使用者可以：
- 用內建的 19 題範例題庫試玩
- 上傳自己的 JSON 題庫（考證照、單字、筆記都行）
- 用 AI 把筆記變成題庫

| 項目 | 內容 |
|---|---|
| 線上網址 | https://echo-eta-virid.vercel.app |
| GitHub | https://github.com/rabr025-byte/echo（公開） |
| 本機資料夾 | ~/Desktop/echo |
| 授權 | MIT 開源 |

---

## 二、技術架構（簡單版）

- **做法**：Vite + React 18 + TypeScript + Tailwind CSS
- **圖示**：lucide-react（不用 emoji）
- **AI**：Gemini（模型 gemini-2.0-flash），使用者自己填 API Key
- **沒有後端、沒有資料庫、沒有帳號**。所有資料存在使用者自己的瀏覽器（localStorage）
- **部署**：push 到 GitHub → Vercel 自動上線

---

## 三、檔案位置

```
~/Desktop/echo/
├── spec.md / CHANGELOG.md / CLAUDE.md   交接文件（就是這三份）
├── README.md / LICENSE / CONTRIBUTING.md 開源門面
├── docs/                                 SRS、PRD、舊交接文件
├── public/banks/echo_sample.json         內建範例題庫（19 題，原創）
├── .gitignore                            不上傳清單（含 題庫/、*ipas*.json 備援）
└── src/
    ├── App.tsx              總控：載入題庫、切換畫面
    ├── index.css            主題顏色 + 所有動畫
    ├── types/bank.ts        題庫格式定義
    ├── lib/
    │   ├── useGame.ts       ★ 遊戲核心：出題、計分、連擊、血量
    │   ├── storage.ts       進度、錯題、紀錄的存取
    │   ├── bankStore.ts     題庫存檔、切換、刪除
    │   ├── composeBank.ts   多批合併、多題庫一起考
    │   ├── parseBankJson.ts 讀 JSON（會自動清註解）
    │   ├── validateBank.ts  檢查題庫格式
    │   ├── themes.ts        三個主題
    │   ├── settings.ts      設定存取
    │   ├── streak.ts        連續登入
    │   ├── daily.ts         每日任務
    │   ├── ghost.ts         幽靈對手
    │   └── ai/              AI 串接與提示詞
    └── components/
        ├── Quiz.tsx         ★ 答題畫面
        ├── Menu.tsx         主選單
        ├── Result.tsx       結算
        ├── BankPicker.tsx   題庫管理
        ├── Settings.tsx     設定
        ├── AiGenerate.tsx   AI 生成題庫
        ├── BankGuide.tsx    題庫製作指南（可複製的 AI 指令）
        ├── StatsPanel.tsx   圖鑑 + 歷史紀錄
        ├── StreakCalendar.tsx 連續登入月曆
        └── Tutorial.tsx     新手導覽
```

---

## 四、主要功能與規則

### 遊戲模式
| 模式 | 題數 | 說明 |
|---|---|---|
| 標準 | 可選 10 / 25 / 50 / 100 / 全部（預設 10） | 主要玩法 |
| 進階 | 固定 50 | 不吃上面的題數設定 |
| 限時 | 全部 | 答對自動跳下一題 |
| 極限 | 全部 | 答錯一次就結束 |
| 錯題本 | 錯過的題 | 複習 |
| AI 幻影 | 1 題 | AI 即時出題，要 API Key |
| 申論 | 5 題 | AI 打分數，60 分以上算過，要 API Key |

### 計分與血量
- 答對：100 分 + 連擊數 × 10（連擊加分最多 500）
- 賭注：該題分數兩倍，答錯扣兩顆心
- 5 顆心，答錯扣一顆，扣完結束
- 每連擊 5 題放一次特效

### 題庫規則
- 每個題庫有唯一的 `bankId`，所有進度都綁這個 id，不同題庫互不干擾
- 上傳後存在瀏覽器，重開還在；可切換、可刪除（刪除會連進度一起清）
- **一個檔案裡有多份題庫**（AI 分批產生的）→ 自動合併成一份，並刪掉重複題
- **可以一次選多個檔案上傳**
- **不同題庫可以勾選多份一起考**（例如科目一 + 科目二）
  - 每題對錯記回它原本的題庫
  - 整場成績記在「這個組合」名下
- 讀檔很寬容：會自動清掉 `#` 註解、說明文字、```json 外框
- 讀檔失敗會說「第幾行附近」出錯
- 題目文字裡如果有沒處理的雙引號 `"`，還是會壞，要手動改成 `「」` 或 `'`

### 其他
- 連續登入（火焰天數 + 月曆）、每日任務（3 個目標）、幽靈對手（跟上次的自己比）
- 圖鑑（每題掌握度顏色格子）、歷史紀錄排行（前 10 名）
- 三個主題：暗夜（主力）、紙感、霓虹
- 首次打開有 4 步新手導覽，最後以「開始第一局」直接開始；完成一局後不再顯示
- 答題頁有一次性賭注提示，離開已作答的局會先確認
- 結算可「再來一局」或「練錯題」
- 題庫管理可將 ChatGPT 完整回覆貼回匯入
- `scripts/daily-smoke.mjs` 搭配 `.github/workflows/daily-smoke.yml` 執行每日瀏覽器 smoke test

---

## 五、已知問題

**🔴 嚴重（要先處理）**

1. ~~沒有 `.gitignore`~~ → **v1.1.3 已補上**，node_modules、dist、.DS_Store 已從 GitHub 移除
2. ~~舊的 IPAS 考題還在 GitHub 歷史紀錄裡~~ → **已清除**：GitHub repo 刪掉重建，只留一個乾淨 commit
   - 舊紀錄只在本機備份 `~/Desktop/echo1009`（已拔掉 GitHub 連線，不要從那裡推送）
3. ~~`題庫/` 可能被誤推~~ → **已解決**：私人題庫已搬到 `~/Documents/echo題庫`（不在專案裡），`.gitignore` 也擋了 `題庫/` 和 `*ipas*.json` 當備援
   - 注意：`題庫/` 裡的科目二出處像真實考古題，一樣不能上傳

**🟡 一般**

4. **AI 功能沒用真的 API Key 完整測過**
5. **Gemini 模型名稱 `gemini-2.0-flash` 可能已過時**（未確認，需上 Google 官網查）
6. **`package.json` 版本號一直是 0.1.0**，沒有跟著更新
7. 沒有音效
8. 進階模式題數寫死 50
9. 紙感主題沒逐頁細修
10. 電腦大螢幕只有中間一條（手機優先設計）
11. 瀏覽器儲存上限約 5MB，題庫很多可能會滿

---

## 六、下一步（依順序）

1. ~~補 `.gitignore` 並把雜檔從 GitHub 移除~~（v1.1.3 完成）
2. ~~清除 GitHub 歷史裡的 IPAS 題庫~~（已完成：repo 重建）
3. **用真的 API Key 測 AI 四大功能**，順便確認 Gemini 模型名稱
4. 音效
5. 進階模式也吃題數設定（或拿掉進階模式）
6. 紙感主題細修

---

## 七、還沒決定、要問使用者的事

1. ~~GitHub 歷史裡的 IPAS 題庫要不要清掉~~ → 已決定並完成：刪掉 repo 重建（舊紀錄只留本機備份 echo1009）
2. ~~`題庫/` 要放哪~~ → 已決定：搬到 `~/Documents/echo題庫`
3. 音效要用程式合成，還是找現成音檔？
4. 進階模式要保留，還是併進「標準 + 自訂題數」？
5. 要不要做電腦版寬螢幕排版？
6. 要不要做「匯出題庫」讓使用者備份或分享？
