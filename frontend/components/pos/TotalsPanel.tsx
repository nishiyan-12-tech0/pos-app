"use client";

// ⑥ 合計（税率ごとの内訳つき）と ⑦ 購入確定
import { ratePercent, yen } from "@/lib/format";
import { usePosStore } from "@/store/posStore";

type Props = { onPurchase: () => void; purchasing: boolean };

export function TotalsPanel({ onPurchase, purchasing }: Props) {
  const calc = usePosStore((s) => s.calc);
  const status = usePosStore((s) => s.calcStatus);
  const calcError = usePosStore((s) => s.calcError);
  const hasItems = usePosStore((s) => s.items.length > 0);

  const ready = hasItems && status === "ok" && calc !== null;
  const row = "flex justify-between text-slate-600";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <h2 className="mb-2 font-bold text-slate-700">⑥ 合計</h2>

      {calc && hasItems ? (
        <div className={`space-y-1 ${status === "loading" ? "opacity-50" : ""}`}>
          <div className={row}>
            <span>小計（値引き前・税抜）</span>
            <span className="tabular-nums">{yen(calc.subtotal_before_discount)}</span>
          </div>
          {calc.total_discount_amount > 0 && (
            <div className={row}>
              <span>会員割引</span>
              <span className="tabular-nums text-red-600">-{yen(calc.total_discount_amount)}</span>
            </div>
          )}
          <div className={row}>
            <span>税抜合計</span>
            <span className="tabular-nums">{yen(calc.total_excl_tax)}</span>
          </div>
          <div className={row}>
            <span>
              消費税
              <span className="ml-1 text-xs">
                （{calc.tax_summaries.map((t) => `${ratePercent(t.tax_rate_percent)}対象 ${yen(t.tax_amount)}`).join(" / ")}）
              </span>
            </span>
            <span className="tabular-nums">{yen(calc.tax_amount)}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-slate-200 pt-2">
            <span className="font-bold text-slate-800">税込合計</span>
            <span className="text-3xl font-bold tabular-nums text-slate-900">{yen(calc.total_incl_tax)}</span>
          </div>
        </div>
      ) : (
        <p className="py-2 text-sm text-slate-400">{hasItems ? "計算中…" : "商品がありません"}</p>
      )}

      {status === "error" && calcError && (
        <p role="alert" className="mt-2 rounded bg-red-50 px-2 py-1 text-sm text-red-700">
          {calcError}
        </p>
      )}

      <button
        type="button"
        onClick={onPurchase}
        disabled={!ready || purchasing}
        className="mt-3 w-full rounded-lg bg-blue-600 py-4 text-xl font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
      >
        {purchasing ? "確定中…" : status === "loading" && hasItems ? "計算中…" : "⑦ 購入確定"}
      </button>
    </section>
  );
}
