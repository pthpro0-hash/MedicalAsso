import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.loca.lt"],
  outputFileTracingRoot: path.resolve(__dirname),
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.loca.lt"],
      bodySizeLimit: "4mb"
    }
  }
};

export default nextConfig;
