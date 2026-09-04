import type { NextConfig } from "next";

// L'API backend est exposée sous /api/* sur la même origine que le frontend :
// pas de CORS côté navigateur, et une seule URL publique à gérer en production.
const API_URL = process.env.API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
