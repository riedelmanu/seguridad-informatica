import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Impide que la app sea embebida en iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Impide que el browser infiera MIME types distintos al declarado
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Limita la información del Referer en requests cross-origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Deshabilita funcionalidades de hardware no necesarias
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
