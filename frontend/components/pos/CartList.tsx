"use client";

// ⑤ 購入リスト：行をタップで選択（選択行は強調表示）、値引きがある行は値引き額を表示
import { yen } from "@/lib/format";
import { usePosStore } from "@/store/posStore";

export function CartList() {
  const items = usePosStore((s) => s.items);
  const selectedCode = usePosStore((s) => s.selectedCode);
  const calc = usePosStore((s) => s.calc);
  const select = usePosStore((s) => s.select);

  const lines = new Map(calc?.items.map((l) => [l.product_code, l]));
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <section className="flex min-h-[16rem] flex-col rounded-xl border border-slate-200 bg-white p-3">
      <h2 className="mb-2 font-bold text-slate-700">⑤ 購入リスト（{totalCount}点）</h2>

      {items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-slate-400">商品をスキャンしてください</p>
      ) : (
        <div className="-mx-1 overflow-y-auto lg:max-h-[calc(100vh-24rem)]">
          <table className="w-full table-fixed text-left">
            <thead className="sticky top-0 bg-white text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-1 py-1">商品名</th>
                <th className="w-16 px-1 py-1 text-right">単価</th>
                <th className="w-12 px-1 py-1 text-right">数量</th>
                <th className="w-20 px-1 py-1 text-right">小計</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const line = lines.get(item.product_code);
                const selected = item.product_code === selectedCode;
                return (
                  <tr
                    key={item.product_code}
                    onClick={() => select(item.product_code)}
                    aria-selected={selected}
                    className={`cursor-pointer border-b border-slate-100 ${
                      selected ? "bg-blue-100 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-1 py-2">
                      <span className={`block truncate ${selected ? "font-bold text-blue-900" : "text-slate-800"}`}>
                        {item.product_name}
                      </span>
                      {line?.discount_note && (
                        <span className="block truncate text-xs text-red-600">{line.discount_note}</span>
                      )}
                    </td>
                    <td className="px-1 py-2 text-right tabular-nums">{item.unit_price.toLocaleString()}</td>
                    <td className="px-1 py-2 text-right font-bold tabular-nums">{item.quantity}</td>
                    <td className="px-1 py-2 text-right tabular-nums">
                      {line ? (
                        <>
                          {line.discount_amount > 0 && (
                            <span className="block text-xs text-red-600">-{line.discount_amount.toLocaleString()}</span>
                          )}
                          {yen(line.line_amount_excl_tax)}
                        </>
                      ) : (
                        <span className="text-slate-400">{yen(item.unit_price * item.quantity)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
