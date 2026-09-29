// バックエンド(FastAPI)の schemas/*.py と対応する型定義

export type Staff = {
  staff_id: string;
  staff_name: string;
  role: "admin" | "general";
};

export type Product = {
  product_code: string;
  product_name: string;
  unit_price: number; // 税抜単価(円)
};

export type Member = {
  member_id: string;
  member_name: string;
};

export type CartItemRequest = {
  product_code: string;
  quantity: number; // 1〜99
};

export type CartLine = {
  line_no: number;
  product_code: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  tax_rate_percent: string; // "8.00" のような文字列で返ってくる
  discount_id: number | null;
  discount_note: string | null;
  unit_discount: number;
  discount_amount: number;
  line_amount_excl_tax: number;
};

export type TaxSummary = {
  tax_rate_percent: string;
  taxable_amount_excl_tax: number;
  tax_amount: number;
};

export type CartCalculateResponse = {
  member: Member | null;
  items: CartLine[];
  tax_summaries: TaxSummary[];
  subtotal_before_discount: number;
  total_discount_amount: number;
  total_excl_tax: number;
  tax_amount: number;
  total_incl_tax: number;
};

export type PurchaseResponse = {
  transaction_id: string;
  transaction_datetime: string;
  total_discount_amount: number;
  total_excl_tax: number;
  tax_amount: number;
  total_incl_tax: number;
  tax_summaries: TaxSummary[];
};
