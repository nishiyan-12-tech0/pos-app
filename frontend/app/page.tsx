import { redirect } from "next/navigation";

// トップ(/)に来たらPOS画面へ。未ログインならPOS画面がログイン画面へ送る
export default function Home() {
  redirect("/pos");
}
