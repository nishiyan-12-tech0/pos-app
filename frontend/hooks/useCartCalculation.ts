"use client";

// 購入リストか会員が変わるたびに、バックエンドで値引き・税・合計を計算し直す
//   → 会員IDを後から入力しても、先にスキャンした商品に値引きが自動で反映される
import { useEffect, useRef } from "react";

import { api, ApiError } from "@/lib/api";
import { usePosStore } from "@/store/posStore";

const DEBOUNCE_MS = 150; // ＋ボタン連打などで何度も呼ばないよう少し待つ

export function useCartCalculation(onUnauthorized: () => void) {
  const items = usePosStore((s) => s.items);
  const memberId = usePosStore((s) => s.member?.member_id ?? null);
  const recalcKey = usePosStore((s) => s.recalcKey);
  const latestRequest = useRef(0);

  useEffect(() => {
    const { setCalcLoading, setCalcResult, setCalcError } = usePosStore.getState();
    const requestId = ++latestRequest.current;

    if (items.length === 0) {
      setCalcResult(null);
      return;
    }
    setCalcLoading();

    const timer = setTimeout(async () => {
      try {
        const result = await api.calculateCart(
          items.map((i) => ({ product_code: i.product_code, quantity: i.quantity })),
          memberId,
        );
        // 遅れて返ってきた古い計算結果で上書きしないよう、最新の依頼の結果だけ採用する
        if (requestId === latestRequest.current) setCalcResult(result);
      } catch (err) {
        if (requestId !== latestRequest.current) return;
        if (err instanceof ApiError && err.status === 401) return onUnauthorized();
        setCalcError(err instanceof ApiError ? err.message : "金額を計算できませんでした");
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [items, memberId, recalcKey, onUnauthorized]);
}
