import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: ws: wss:;",
          },
        ],
      },
    ];
  },

  // Enable TypeScript strict mode - fix all errors before production
  typescript: {
    // TODO: Fix all TS errors, then set to false
    ignoreBuildErrors: false,
  },

  // Enable React Strict Mode
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
