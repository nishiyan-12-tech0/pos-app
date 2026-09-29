"use client";

// ① カメラでバーコードを連続して読み取る
//   一度「開始」すれば止めるまで読み取りを続ける（1回ごとに終了しない：要求2.1）
import type { IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

const SAME_CODE_IGNORE_MS = 1500; // 同じバーコードを枠内に置いたままでも連続で拾わないための間隔

type Props = { onDetected: (code: string) => void };

export function BarcodeScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  const lastRead = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!active || !videoRef.current) return;
    let controls: IScannerControls | undefined;
    let cancelled = false;

    (async () => {
      try {
        // ライブラリはカメラを使うときだけ読み込む（初回表示を軽くするため）
        const { BrowserMultiFormatOneDReader } = await import("@zxing/browser");
        const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
        const hints = new Map([
          // JAN(13桁/8桁)=商品、CODE128=会員カード を想定
          [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128]],
        ]);
        const reader = new BrowserMultiFormatOneDReader(hints, { delayBetweenScanAttempts: 100 });
        const c = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } }, // スマホ・タブレットは背面カメラ
          videoRef.current!,
          (result) => {
            if (!result) return;
            const code = result.getText();
            const now = Date.now();
            if (code === lastRead.current.code && now - lastRead.current.at < SAME_CODE_IGNORE_MS) return;
            lastRead.current = { code, at: now };
            onDetectedRef.current(code);
          },
        );
        if (cancelled) c.stop();
        else controls = c;
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof Error ? err.name : "";
        setError(
          name === "NotAllowedError"
            ? "カメラの使用が許可されていません。ブラウザの設定で許可してください"
            : name === "NotFoundError"
              ? "カメラが見つかりません"
              : "カメラを起動できません（https または localhost でのみ利用できます）",
        );
        setActive(false);
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [active]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold text-slate-700">① カメラスキャン</h2>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setActive((a) => !a);
          }}
          className={`rounded-lg px-3 py-1 text-sm font-bold text-white ${
            active ? "bg-slate-500 hover:bg-slate-600" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {active ? "停止" : "スキャン開始"}
        </button>
      </div>

      <div className="relative aspect-[5/2] overflow-hidden sm:aspect-[16/9] rounded-lg bg-slate-900">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {active ? (
          <div className="pointer-events-none absolute inset-x-[15%] top-1/2 h-1/3 -translate-y-1/2 rounded border-2 border-dashed border-emerald-400" />
        ) : (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            「スキャン開始」でカメラを起動
          </p>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
