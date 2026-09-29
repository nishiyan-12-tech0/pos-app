// POS画面全体で共有する状態（Zustand）
//   購入リスト・選択中の商品・会員・計算結果をここに集め、各部品はここから読み書きする。
//   選択状態は「行番号」ではなく「商品コード」で持つ → 行を削除しても選択がずれない。
import { create } from "zustand";

import type { CartCalculateResponse, Member, Product } from "@/types/api";

export const MAX_QUANTITY = 99;
export const MAX_LINES = 100;

export type CartItem = {
  product_code: string;
  product_name: string;
  unit_price: number;
  quantity: number;
};

export type ToastKind = "success" | "error" | "info";
export type Toast = { id: number; kind: ToastKind; message: string };

type AddResult = { ok: true; quantity: number; isNew: boolean } | { ok: false; message: string };

type PosState = {
  items: CartItem[];
  selectedCode: string | null;
  member: Member | null;
  calc: CartCalculateResponse | null; // バックエンドの計算結果（値引き・税・合計）
  calcStatus: "idle" | "loading" | "ok" | "error";
  calcError: string | null;
  recalcKey: number; // 値を増やすと再計算が走る（購入確定で金額不一致だったときなど）
  toast: Toast | null;

  addProduct: (product: Product) => AddResult;
  setQuantity: (code: string, quantity: number) => void;
  removeItem: (code: string) => void;
  select: (code: string | null) => void;
  setMember: (member: Member | null) => void;
  setCalcLoading: () => void;
  setCalcResult: (calc: CartCalculateResponse | null) => void;
  setCalcError: (message: string) => void;
  requestRecalc: () => void;
  showToast: (kind: ToastKind, message: string) => void;
  clearToast: (id: number) => void;
  reset: () => void; // 会計が終わったら次のお客様のために全部クリア
};

const clampQuantity = (q: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(q)));

let toastSeq = 0;

export const usePosStore = create<PosState>()((set, get) => ({
  items: [],
  selectedCode: null,
  member: null,
  calc: null,
  calcStatus: "idle",
  calcError: null,
  recalcKey: 0,
  toast: null,

  addProduct: (product) => {
    const { items } = get();
    const existing = items.find((i) => i.product_code === product.product_code);

    // すでにリストにある商品 → 新しい行は増やさず数量を +1（要求2.1）
    if (existing) {
      if (existing.quantity >= MAX_QUANTITY) {
        return { ok: false, message: `${product.product_name} はこれ以上追加できません（上限${MAX_QUANTITY}個）` };
      }
      const quantity = existing.quantity + 1;
      set({
        items: items.map((i) => (i.product_code === product.product_code ? { ...i, quantity } : i)),
        selectedCode: product.product_code,
      });
      return { ok: true, quantity, isNew: false };
    }

    // リストにない商品 → 末尾に新しい行として追加
    if (items.length >= MAX_LINES) {
      return { ok: false, message: `購入リストは${MAX_LINES}行までです` };
    }
    set({
      items: [...items, { ...product, quantity: 1 }],
      selectedCode: product.product_code,
    });
    return { ok: true, quantity: 1, isNew: true };
  },

  setQuantity: (code, quantity) =>
    set((s) => ({
      items: s.items.map((i) => (i.product_code === code ? { ...i, quantity: clampQuantity(quantity) } : i)),
    })),

  removeItem: (code) =>
    set((s) => {
      const index = s.items.findIndex((i) => i.product_code === code);
      const items = s.items.filter((i) => i.product_code !== code);
      // 削除後は、同じ位置（なければ1つ上）の行を選択しておくと続けて操作しやすい
      const next = items[Math.min(index, items.length - 1)];
      return { items, selectedCode: s.selectedCode === code ? (next?.product_code ?? null) : s.selectedCode };
    }),

  select: (code) => set({ selectedCode: code }),
  setMember: (member) => set({ member }),

  setCalcLoading: () => set({ calcStatus: "loading", calcError: null }),
  setCalcResult: (calc) => set({ calc, calcStatus: calc ? "ok" : "idle", calcError: null }),
  setCalcError: (message) => set({ calcStatus: "error", calcError: message }),
  requestRecalc: () => set((s) => ({ recalcKey: s.recalcKey + 1 })),

  showToast: (kind, message) => set({ toast: { id: ++toastSeq, kind, message } }),
  clearToast: (id) => set((s) => (s.toast?.id === id ? { toast: null } : {})),

  reset: () =>
    set({
      items: [],
      selectedCode: null,
      member: null,
      calc: null,
      calcStatus: "idle",
      calcError: null,
    }),
}));
