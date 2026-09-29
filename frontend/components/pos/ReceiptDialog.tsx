"use client";

// 購入確定後のポップアップ（税込・税抜の両方を表示：要求2.9）。閉じると次のお客様へ
import { useEffect, useRef } from "react";

import { ratePercent, yen } from "@/lib/format";
import type { PurchaseResponse } from "@/types/api";

type Props = { receipt: PurchaseResponse; onClose: () => void };

export function ReceiptDialog({ receipt, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus(); // Enterキーでもすぐ閉じられるように
  }, []);

  const row = "flex justify-between text-slate-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-center text-lg font-bold text-emerald-700">お会計が完了しました</h2>

        <div className="my-4 text-center">
          <p className="text-sm text-slate-500">税込合計</p>
          <p className="text-4xl font-bold tabular-nums text-slate-900">{yen(receipt.total_incl_tax)}</p>
        </div>

        <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className={row}>
            <span>税抜合計</span>
            <span className="tabular-nums">{yen(receipt.total_excl_tax)}</span>
          </div>
          {receipt.tax_summaries.map((t) => (
            <div key={t.tax_rate_percent} className={row}>
              <span>
                消費税 {ratePercent(t.tax_rate_percent)}（対象 {yen(t.taxable_amount_excl_tax)}）
              </span>
              <span className="tabular-nums">{yen(t.tax_amount)}</span>
            </div>
          ))}
          {receipt.total_discount_amount > 0 && (
            <div className={row}>
              <span>うち会員割引</span>
              <span className="tabular-nums text-red-600">-{yen(receipt.total_discount_amount)}</span>
            </div>
          )}
          <p className="pt-2 text-xs text-slate-400">
            取引番号 {receipt.transaction_id.slice(0, 8)}　{receipt.transaction_datetime.replace("T", " ")}
          </p>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-slate-800 py-3 text-lg font-bold text-white hover:bg-slate-700"
        >
          閉じて次のお客様へ
        </button>
      </div>
    </div>
  );
}
