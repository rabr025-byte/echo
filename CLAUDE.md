# Echo 工作守則（給新的 Claude 看）

使用者不是工程師，請用簡單的話講，不要預設他懂術語。

---

## 開工前先讀

1. `spec.md` — 專案現況、規則、已知問題、下一步
2. `CHANGELOG.md` — 做過什麼
3. 本檔案

更細的背景在 `docs/`（但以 spec.md 為準，docs 裡有些內容比較舊）。

---

## 檔案地圖

**最重要，改之前要特別小心**
- `src/lib/useGame.ts` — 遊戲核心：出題、計分、連擊、血量、幽靈、申論判定
- `src/components/Quiz.tsx` — 答題畫面：選項、特效、愛心、賭注

**資料**
- `src/types/bank.ts` — 題庫格式
- `src/lib/storage.ts` — 進度、錯題、紀錄（全部綁 bankId）
- `src/lib/bankStore.ts` — 題庫存檔、刪除
- `src/lib/composeBank.ts` — 多批合併、多題庫一起考
- `src/lib/parseBankJson.ts` — 讀 JSON（自動清註解）
- `src/lib/validateBank.ts` — 檢查題庫格式

**功能**
- `src/lib/streak.ts` 連續登入｜`daily.ts` 每日任務｜`ghost.ts` 幽靈對手
- `src/lib/themes.ts` 主題｜`settings.ts` 設定
- `src/lib/ai/` AI 串接｜`ai/prompts.ts` 所有 AI 提示詞

**畫面**
- `App.tsx` 總控｜`Menu.tsx` 選單｜`Result.tsx` 結算
- `BankPicker.tsx` 題庫管理｜`Settings.tsx` 設定
- `AiGenerate.tsx` AI 生題庫｜`BankGuide.tsx` 題庫指南（可複製指令）
- `StatsPanel.tsx` 圖鑑紀錄｜`StreakCalendar.tsx` 月曆｜`Tutorial.tsx` 導覽

**樣式**：`src/index.css`（主題顏色 + 動畫）

**不是程式碼**
- `public/banks/echo_sample.json` — 內建範例題庫（原創，公開）
- `題庫/` — 使用者私人題庫（IPAS 考題，**絕對不能上傳**）

---

## 鐵律（以前出過事，不能再犯）

1. **`題庫/` 資料夾和任何 IPAS 考題，絕對不能進 GitHub。** repo 是公開的，會有版權問題。推送前一定要確認。
2. **內建題庫必須是原創。** `public/banks/echo_sample.json` 不能換成任何機構的考題。
3. **進度一律綁 bankId。** 改到進度讀寫，要維持不同題庫互不干擾。
4. **多題庫一起考時，每題對錯要記回原本的題庫**（用 `sourceBankId` / `sourceQuestionId`）。
5. **顏色不能寫死**，一律用 CSS 變數（`bg-bg`、`text-fg`、`bg-accent`…），不然主題會壞。
6. **API Key 絕對不能寫進程式碼。** Key 是使用者自己填、存在他自己的瀏覽器。
7. **手機優先**，畫面要在 390px 寬度下能用。
8. **不要一次改一堆再交出去。** 以前這樣做過，壞掉時找不到原因。
9. **給使用者的修改要確認真的進到專案。** 以前發生過：做好的版本（.gitignore、v1.1.3）使用者沒套用到，後面的人以為有。交付後請他回報，或自己檢查。
10. **工作區的檔案會被清掉。** 雲端暫存的專案副本不可靠，一律以使用者電腦上的 ~/Desktop/echo 為準。

---

## 合作方式

1. **沒有使用者同意，不動手改程式。**
   先說：要做什麼、會改哪些檔案、有什麼風險。他說可以才開始。
2. **一項功能一個 commit。** 不要把不相干的改動混在一起。
3. **改完先跑 build**，通過才交付：
   ```
   npx tsc -b && npm run build
   ```
4. **給完整推送指令，使用者自己推。** commit 訊息要帶版本號。
   在 .gitignore 補好之前，**不要用 `git add .`**，改成指定檔案：
   ```
   cd ~/Desktop/echo
   git add src/ public/ spec.md CHANGELOG.md CLAUDE.md
   git status
   git commit -m "vX.Y.Z 這次改了什麼"
   git push
   ```
   （`git status` 那行是讓他推之前看一眼，確認沒有 `題庫/`）
   .gitignore 補好之後，可以恢復成：
   ```
   cd ~/Desktop/echo
   git add . && git commit -m "vX.Y.Z 這次改了什麼" && git push
   ```
5. 改動小就給片段讓他貼；改動大就整檔給。
6. 程式碼加繁體中文註解。
7. 版本號規則：小修 vX.Y.Z+1，新功能 vX.Y+1.0。
