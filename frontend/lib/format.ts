export const yen = (value: number) => `${value.toLocaleString("ja-JP")}円`;

/** 全角英数字を半角にし、前後の空白を除いて大文字にそろえる（手入力・IME対策） */
export function normalizeCode(raw: string): string {
  return raw
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .trim()
    .toUpperCase();
}

/** "8.00" → "8%" */
export const ratePercent = (rate: string) => `${Number(rate)}%`;
