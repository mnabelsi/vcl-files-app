/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Workspace packages are ESM TS source — let Next compile them.
  transpilePackages: [
    '@vcl/db',
    '@vcl/graph',
    '@vcl/llm',
    '@vcl/enrichment',
    '@vcl/pipeline',
    '@vcl/extract',
  ],
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
};
export default nextConfig;
