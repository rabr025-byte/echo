# Echo 遊戲行為清單(從舊版 IPAS 戰情室萃取,搬遷驗收標準)

## 遊戲模式
| 模式 | 出題來源 | 題數 | 特殊規則 |
|---|---|---|---|
| normal(標準) | 篩選後題庫隨機 | 10 | 標準答題 |
| hard(進階) | 篩選後題庫隨機 | 50 | 題數多 |
| speed(限時) | 篩選後全部 | 全部 | 答對自動跳下一題(400ms);答錯不自動跳 |
| sudden_death(極限) | 篩選後全部隨機 | 全部 | 答錯立即結束(1000ms 後) |
| mistake(錯題本) | mistakes 陣列 | 全部 | 練習錯過的題 |
| phantom(AI 幻影) | AI 即時生成 | 1 | 需 API Key,第四階段做 |

## 篩選條件
- subjectFilter: all / sub1(科目1) / sub2(科目2) → 對應 question.subject
- levelFilters: all / basic(cat1) / primary(cat2) / advanced(cat3) → 對應 question.category
- 注意:舊版預設鎖住 cat===3(中級),`pool.filter(q => q.cat !== 3)`。Echo 通用版**不鎖**,開放全部。

## 計分(答對時)
- 基礎分 100
- 連擊獎勵 bonus = min(combo × 10, 500)
- 得分 pts = 100 + bonus
- gamePoints 累加 pts
- combo +1
- 浮動文字顯示 +pts(青色)

## 答錯時
- HP - 20
- combo 歸零
- 浮動文字顯示 "-20% HP"(紅色)
- 螢幕震動 + 故障效果(500ms)
- 紅色閃光層(150ms)
- 存入錯題本(不重複)
- HP <= 0 → 1000ms 後結束遊戲
- sudden_death 模式 → 答錯直接 1000ms 後結束

## HP 系統
- 初始 100
- 每次答錯 -20(可錯 5 次)
- HP <= 0 遊戲結束

## 觸覺回饋(navigator.vibrate)
- 答對:震動 30ms
- 答錯:震動 [50,50,50]

## 結算
- 存 record(日期、score、total、mode、時間、gamePoints)
- speed 模式 total = 題數;sudden_death total = 已答數;其他 = 題數

## 計時器
- 每秒 +1(setInterval 1000ms)
- 結束時 clearInterval

## 持久化(localStorage)
- ipas_mistakes:錯題本 → Echo 改為 echo:{bankId}:mistakes(多題庫隔離)
- 答題統計 qStats → echo:{bankId}:stats
- 歷史紀錄 records → echo:{bankId}:records

## 音效/音樂
- 答對音效、答錯音效、BGM(舊版用外部 URL)→ Echo 第五階段 UI 時處理,先保留接口
