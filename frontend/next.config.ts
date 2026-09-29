import type { NextConfig } from "next";

// バックエンド(FastAPI)の場所。ローカルでは uvicorn の 8000番、Azureでは App Service のURLを環境変数で渡す
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // ブラウザは /api/... を Next.js(3000番) に送り、Next.js がバックエンドへ中継する（BFF）
  // → ブラウザから見て同じサイトになるので、ログインのCookieがそのまま使える
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
