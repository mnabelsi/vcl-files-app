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
  webpack: (config) => {
    // Workspace packages use `.js` extensions in imports (NodeNext/Bundler
    // style) but the source files are `.ts`. Tell webpack to resolve `.js`
    // specifiers to `.ts` when bundling transpiled packages.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};
export default nextConfig;
