"use client";

// ② コードの手入力（USB接続のバーコードリーダーも「入力＋Enter」なのでここで受けられる）
import { forwardRef, useState, type FormEvent } from "react";

type Props = { onSubmit: (code: string) => Promise<unknown> };

export const CodeInput = forwardRef<HTMLInputElement, Props>(function CodeInput({ onSubmit }, ref) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!value.trim() || busy) return;
    setBusy(true);
    await onSubmit(value);
    setValue(""); // 次のコードをすぐ入力できるようにクリア
    setBusy(false);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <h2 className="mb-2 font-bold text-slate-700">② コード手入力</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="商品コード または 会員ID（M〜）"
          inputMode="text"
          autoComplete="off"
          maxLength={20}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 font-bold text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
        >
          追加
        </button>
      </form>
    </section>
  );
});
