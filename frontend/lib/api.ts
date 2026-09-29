// バックエンドAPIの呼び出しをまとめたファイル
// 画面(コンポーネント)からは fetch を直接書かず、ここの関数を使う
import type {
  CartCalculateResponse,
  CartItemRequest,
  Member,
  Product,
  PurchaseResponse,
  Staff,
} from "@/types/api";

/** APIがエラーを返したときの例外。status でエラーの種類、message で画面に出す文言がわかる */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** FastAPIのエラー応答 {"detail": ...} から画面用のメッセージを取り出す */
function toMessage(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return "入力内容に誤りがあります"; // 422（入力チェックのエラー）
  if (status >= 500) return "サーバーでエラーが発生しました。時間をおいて再度お試しください";
  return `エラーが発生しました（${status}）`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      credentials: "same-origin", // ログインCookieを一緒に送る
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "サーバーに接続できません。ネットワークを確認してください");
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, toMessage(res.status, body));
  return body as T;
}

const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) });

export const api = {
  login: (staff_id: string, password: string) => post<Staff>("/api/auth/login", { staff_id, password }),
  logout: () => post<void>("/api/auth/logout"),
  me: () => request<Staff>("/api/auth/me"),

  getProduct: (code: string) => request<Product>(`/api/products/${encodeURIComponent(code)}`),
  getMember: (memberId: string) => request<Member>(`/api/members/${encodeURIComponent(memberId)}`),

  calculateCart: (items: CartItemRequest[], member_id: string | null) =>
    post<CartCalculateResponse>("/api/cart/calculate", { items, member_id }),

  purchase: (
    items: CartItemRequest[],
    member_id: string | null,
    register_id: string,
    expected_total_incl_tax: number,
  ) =>
    post<PurchaseResponse>("/api/transactions", { items, member_id, register_id, expected_total_incl_tax }),
};
