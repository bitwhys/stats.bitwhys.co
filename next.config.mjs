/** @type {import('next').NextConfig} */

const nextConfig = {
  async headers() {
    return [
      {
        // cache static DuckDB assets in the browser; change query string or path if you upgrade versions
        source: "/duckdb/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
