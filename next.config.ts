import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Los JSON de /data se leen en el servidor; nos aseguramos de incluirlos.
  outputFileTracingIncludes: { "/**": ["./data/**/*.json"] },
};

export default nextConfig;
