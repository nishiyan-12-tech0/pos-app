"use client";

// ④ 選択中の商品：詳細表示・数量変更（1〜99）・削除
import { yen } from "@/lib/format";
import { MAX_QUANTITY, usePosStore } from "@/store/posStore";

export function SelectedItemPanel() {
  const selectedCode = usePosStore((s) => s.selectedCode);
  const item = usePosStore((s) => s.items.find((i) => i.product_code === s.selectedCode));
  const line = usePosStore((s) => s.calc?.items.find((l) => l.product_code === s.selectedCode));
  const setQuantity = usePosStore((s) => s.setQuantity);
  const removeItem = usePosStore((s) => s.removeItem);

  if (!selectedCode || !item) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="mb-2 font-bold text-slate-700">④ 選択中の商品</h2>
        <p className="text-sm text-slate-500">購入リストの行をタップすると、ここで数量変更・削除ができます</p>
      </section>
    );
  }

  const btn =
    "h-11 w-11 rounded-lg border border-slate-300 text-xl font-bold text-slate-700 hover:bg-slate-50 disabled:text-slate-300";

  return (
    <section className="rounded-xl border-2 border-blue-500 bg-white p-3">
      <h2 className="mb-1 font-bold text-slate-700">④ 選択中の商品</h2>
      <p className="text-lg font-bold text-slate-900">{item.product_name}</p>
      <p className="text-sm text-slate-500">
        コード {item.product_code}　単価 {yen(item.unit_price)}
        {line && line.unit_discount > 0 && (
          <span className="ml-2 text-red-600">会員割引 -{yen(line.unit_discount)}/個</span>
        )}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="数量を1減らす"
          className={btn}
          disabled={item.quantity <= 1} // 0個にはしない（0にするときは削除：要求2.4）
          onClick={() => setQuantity(item.product_code, item.quantity - 1)}
        >
          －
        </button>
        <input
          aria-label="数量"
          type="number"
          min={1}
          max={MAX_QUANTITY}
          value={item.quantity}
          onChange={(e) => {
            const q = Number(e.target.value);
            if (Number.isFinite(q) && q >= 1) setQuantity(item.product_code, q);
          }}
          className="h-11 w-16 rounded-lg border border-slate-300 text-center text-xl font-bold text-slate-900"
        />
        <button
          type="button"
          aria-label="数量を1増やす"
          className={btn}
          disabled={item.quantity >= MAX_QUANTITY}
          onClick={() => setQuantity(item.product_code, item.quantity + 1)}
        >
          ＋
        </button>
        <button
          type="button"
          onClick={() => removeItem(item.product_code)}
          className="ml-auto h-11 rounded-lg border border-red-300 px-4 font-bold text-red-600 hover:bg-red-50"
        >
          削除
        </button>
      </div>
    </section>
  );
}
