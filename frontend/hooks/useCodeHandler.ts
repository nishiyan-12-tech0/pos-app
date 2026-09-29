"use client";

// スキャン・手入力されたコードを処理する（どちらもここを通るので挙動がそろう）
//   先頭が「M」 → 会員ID、数字だけ → 商品コード
import { useCallback } from "react";

import { api, ApiError } from "@/lib/api";
import { normalizeCode } from "@/lib/format";
import { beep } from "@/lib/sound";
import { usePosStore } from "@/store/posStore";

export type CodeResult = "product" | "member" | "error";

export function useCodeHandler(onUnauthorized: () => void) {
  return useCallback(
    async (raw: string): Promise<CodeResult> => {
      const code = normalizeCode(raw);
      const { addProduct, setMember, showToast } = usePosStore.getState();
      const fail = (message: string): CodeResult => {
        beep("error");
        showToast("error", message);
        return "error";
      };

      if (!code) return "error";

      try {
        // --- 会員ID ---
        if (code.startsWith("M")) {
          const member = await api.getMember(code);
          setMember(member);
          beep("success");
          showToast("info", `会員 ${member.member_name} 様を読み込みました`);
          return "member";
        }

        // --- 商品コード ---
        if (!/^\d{1,13}$/.test(code)) return fail(`コードの形式が正しくありません（${code}）`);

        const product = await api.getProduct(code);
        const result = addProduct(product);
        if (!result.ok) return fail(result.message);

        beep("success");
        showToast(
          "success",
          result.isNew
            ? `${product.product_name} を追加しました`
            : `${product.product_name} を追加しました（数量 ${result.quantity}）`,
        );
        return "product";
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return "error";
        }
        if (err instanceof ApiError && err.status === 404) {
          return fail(code.startsWith("M") ? `会員が見つかりません（${code}）` : `商品がマスタ未登録です（${code}）`);
        }
        return fail(err instanceof ApiError ? err.message : "読み取りに失敗しました");
      }
    },
    [onUnauthorized],
  );
}
