/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
  },
  // Fixed catch-all routing that preserves static assets
  async rewrites() {
    return {
      beforeFiles: [
        // Catch all non-API, non-static routes and rewrite to home page for SPA routing
        {
          source: '/((?!api|_next|_static|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)',
          destination: '/',
        },
      ],
    }
  },
}

export default nextConfig