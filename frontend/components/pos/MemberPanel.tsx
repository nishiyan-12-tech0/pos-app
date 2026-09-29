"use client";

// ③ 会員（会員カードのスキャン or 手入力で読み込む。購入確定まではいつでも入力・解除できる）
import { usePosStore } from "@/store/posStore";

export function MemberPanel() {
  const member = usePosStore((s) => s.member);
  const setMember = usePosStore((s) => s.setMember);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <h2 className="mb-2 font-bold text-slate-700">③ 会員</h2>
      {member ? (
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate">
            <span className="mr-2 rounded bg-blue-50 px-2 py-0.5 font-mono text-sm text-blue-700">
              {member.member_id}
            </span>
            <span className="font-bold text-slate-800">{member.member_name} 様</span>
          </p>
          <button
            type="button"
            onClick={() => setMember(null)}
            className="shrink-0 text-sm text-slate-500 underline hover:text-slate-700"
          >
            解除
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">会員なし（会員カードをスキャンすると会員割引が適用されます）</p>
      )}
    </section>
  );
}
