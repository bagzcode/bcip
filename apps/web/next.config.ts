import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(appDir, '../..');

const nextConfig: NextConfig = {
  transpilePackages: ['@bcip/ui', '@bcip/contracts', '@bcip/domain', '@bcip/db'],
  output: 'standalone',
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
