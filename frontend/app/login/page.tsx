"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.login(staffId.trim(), password);
      router.replace("/pos"); // 成功したらPOS画面へ（戻るボタンでログイン画面に戻らないよう replace）
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ログインに失敗しました");
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-md"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">簡易POS</h1>
          <p className="mt-1 text-sm text-slate-500">担当者ログイン</p>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">担当者ID</span>
          <input
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            maxLength={20}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            maxLength={128}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-3 text-lg font-bold text-white hover:bg-blue-700 disabled:bg-slate-400"
        >
          {submitting ? "確認中…" : "ログイン"}
        </button>
      </form>
    </main>
  );
}
