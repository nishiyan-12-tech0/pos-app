"use client";

// 画面下の通知（「1件追加された」などのフィードバック）。数秒で自動的に消える
import { useEffect } from "react";

import { usePosStore } from "@/store/posStore";

const STYLE = {
  success: "bg-emerald-600",
  info: "bg-blue-600",
  error: "bg-red-600",
} as const;

export function ToastMessage() {
  const toast = usePosStore((s) => s.toast);
  const clearToast = usePosStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => clearToast(toast.id), toast.kind === "error" ? 4000 : 2000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;
  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      className={`fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-xl px-4 py-3 text-center font-bold text-white shadow-lg ${STYLE[toast.kind]}`}
    >
      {toast.message}
    </div>
  );
}
