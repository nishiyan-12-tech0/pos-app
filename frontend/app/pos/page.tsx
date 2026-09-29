"use client";

// POS画面：左に入力系（スキャン・手入力・会員・選択中の商品）、右に購入リストと合計
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { BarcodeScanner } from "@/components/pos/BarcodeScanner";
import { CartList } from "@/components/pos/CartList";
import { CodeInput } from "@/components/pos/CodeInput";
import { MemberPanel } from "@/components/pos/MemberPanel";
import { ReceiptDialog } from "@/components/pos/ReceiptDialog";
import { SelectedItemPanel } from "@/components/pos/SelectedItemPanel";
import { ToastMessage } from "@/components/pos/ToastMessage";
import { TotalsPanel } from "@/components/pos/TotalsPanel";
import { useCartCalculation } from "@/hooks/useCartCalculation";
import { useCodeHandler } from "@/hooks/useCodeHandler";
import { api, ApiError } from "@/lib/api";
import { usePosStore } from "@/store/posStore";
import type { PurchaseResponse, Staff } from "@/types/api";

// このレジ端末のID（register テーブルの register_id）。端末ごとに .env.local で変える
const REGISTER_ID = process.env.NEXT_PUBLIC_REGISTER_ID ?? "R01";

export default function PosPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [receipt, setReceipt] = useState<PurchaseResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ログイン切れ（401）になったらログイン画面へ
  const goLogin = useCallback(() => router.replace("/login"), [router]);

  useEffect(() => {
    api.me().then(setStaff).catch(goLogin);
  }, [goLogin]);

  useCartCalculation(goLogin);
  const handleCode = useCodeHandler(goLogin);

  async function handlePurchase() {
    const { items, member, calc, showToast, requestRecalc } = usePosStore.getState();
    if (!calc || items.length === 0) return;
    setPurchasing(true);
    try {
      const result = await api.purchase(
        items.map((i) => ({ product_code: i.product_code, quantity: i.quantity })),
        member?.member_id ?? null,
        REGISTER_ID,
        calc.total_incl_tax, // 画面に表示している金額。サーバーの再計算と違えば確定されない
      );
      setReceipt(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return goLogin();
      showToast("error", err instanceof ApiError ? err.message : "購入を確定できませんでした");
      if (err instanceof ApiError && err.status === 409) requestRecalc(); // 最新の金額を表示し直す
    } finally {
      setPurchasing(false);
    }
  }

  function handleReceiptClose() {
    setReceipt(null);
    usePosStore.getState().reset(); // 購入リスト・会員をクリアして次のお客様へ
    inputRef.current?.focus();
  }

  async function handleLogout() {
    await api.logout().catch(() => undefined);
    usePosStore.getState().reset();
    goLogin();
  }

  if (!staff) return <p className="p-8 text-slate-500">読み込み中…</p>;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between gap-3 bg-slate-800 px-4 py-2 text-white">
        <h1 className="text-lg font-bold">簡易POS</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline">レジ {REGISTER_ID}</span>
          <span>担当：{staff.staff_name}</span>
          <button onClick={handleLogout} className="rounded bg-slate-600 px-3 py-1 hover:bg-slate-500">
            ログアウト
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-3 p-3 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <BarcodeScanner onDetected={handleCode} />
          <CodeInput ref={inputRef} onSubmit={handleCode} />
          <MemberPanel />
          <SelectedItemPanel />
        </div>
        <div className="space-y-3 lg:col-span-7">
          <CartList />
          <TotalsPanel onPurchase={handlePurchase} purchasing={purchasing} />
        </div>
      </main>

      <ToastMessage />
      {receipt && <ReceiptDialog receipt={receipt} onClose={handleReceiptClose} />}
    </div>
  );
}
