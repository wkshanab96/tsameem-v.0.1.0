/** @type {import('next').NextConfig} */

const nextConfig = {
  // Note: Setting PORT in env doesn't change the server port
  // To change the port, use PORT=3003 npm run dev
  devIndicators: {
    buildActivity: true,
  },
  // Disable static site generation to fix ENOENT errors
  output: "standalone",
  // Disable static optimization to fix ENOENT errors
  staticPageGenerationTimeout: 0,
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // Explicitly set port to 3002 to avoid conflicts with port 3000
  env: {
    PORT: "3002",
  },
};

// Preserve Tempo configuration but ensure experimental settings are merged correctly
if (process.env.NEXT_PUBLIC_TEMPO) {
  // Merge experimental settings instead of overwriting them
  nextConfig.experimental = {
    ...nextConfig.experimental,
    // NextJS 14.1.3 to 14.2.11:
    swcPlugins: [[require.resolve("tempo-devtools/swc/0.90"), {}]],
  };
}

module.exports = nextConfig;
