/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      "firebase-admin",
      "@google-cloud/storage",
      "@google-cloud/tasks",
      "@google-cloud/secret-manager",
      "@google-cloud/translate",
      "sharp",
    ],
  },
};

export default nextConfig;
