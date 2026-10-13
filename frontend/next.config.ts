import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Photos des immeubles hébergées sur Cloudinary
    remotePatterns: [new URL("https://res.cloudinary.com/**")],
  },
};

export default nextConfig;
