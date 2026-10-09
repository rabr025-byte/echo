// src/lib/parseBankJson.ts
// [Echo] 寬容的題庫 JSON 解析
// AI 產出的檔案常夾帶 markdown 圍欄或註解行,先清掉再解析;
// 真的壞掉時回報「第幾行、哪段文字」讓使用者好修

export interface ParseResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

/** 移除 markdown 圍欄與整行註解(# 或 // 開頭),但不動字串內容 */
function cleanup(raw: string): string {
  let t = raw.trim();

  // 去掉 ```json ... ``` 圍欄
  t = t.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '');

  // 逐行處理:清掉夾雜的說明文字與註解
  // 判斷依據:含雙引號的行必定是 JSON 內容,原封不動保留;
  // 不含雙引號的行只可能是結構符號或註解,因此只留下結構字元
  const lines = t.split('\n');
  const kept = lines.map(line => {
    if (line.includes('"')) return line;
    return line.replace(/[^[\]{},:\s]/g, '').trim();
  });
  t = kept.join('\n').trim();

  // 清掉開頭多餘的逗號(註解被移除後可能留下 ,[ 或 [ ,)
  t = t.replace(/^\[\s*,/, '[').replace(/,\s*\]$/, ']');

  return t;
}

/** 由字元位置換算行號與該行內容,方便使用者定位 */
function locate(text: string, pos: number) {
  const before = text.slice(0, pos);
  const line = before.split('\n').length;
  const lineText = text.split('\n')[line - 1] ?? '';
  const snippet = lineText.trim().slice(0, 60);
  return { line, snippet };
}

export function parseBankJson(raw: string): ParseResult {
  const cleaned = cleanup(raw);

  try {
    return { ok: true, data: JSON.parse(cleaned) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // 從錯誤訊息抓出字元位置(各瀏覽器格式略有差異)
    const m = msg.match(/position (\d+)/i);
    if (m) {
      const { line, snippet } = locate(cleaned, Number(m[1]));
      return {
        ok: false,
        error: `JSON 格式錯誤(第 ${line} 行附近):${snippet}\n`
          + '常見原因:題目文字裡有沒跳脫的雙引號("),或檔案中夾帶了註解、說明文字。',
      };
    }
    return {
      ok: false,
      error: 'JSON 格式錯誤。常見原因:題目文字裡有沒跳脫的雙引號("),'
        + '或檔案中夾帶註解、說明文字;若是自己合併多批內容,也可能少了逗號或中括號。',
    };
  }
}
