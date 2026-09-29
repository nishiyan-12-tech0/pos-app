// スキャン結果を音で知らせる（音声ファイル不要。ブラウザの音源で鳴らす）
let ctx: AudioContext | null = null;

function tone(frequency: number, startAt: number, duration: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.08, ctx.currentTime + startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + startAt);
  osc.stop(ctx.currentTime + startAt + duration);
}

export function beep(kind: "success" | "error") {
  try {
    ctx ??= new AudioContext();
    if (kind === "success") {
      tone(1800, 0, 0.12); // ピッ
    } else {
      tone(300, 0, 0.15); // ブッブッ
      tone(300, 0.2, 0.15);
    }
  } catch {
    // 音が出せない環境では何もしない
  }
}
