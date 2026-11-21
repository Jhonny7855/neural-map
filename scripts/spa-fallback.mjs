import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const index = join(dist, 'index.html');
const fallback = join(dist, '404.html');

if (!existsSync(index)) {
  console.error('dist/index.html not found — run the build first.');
  process.exit(1);
}

copyFileSync(index, fallback);
console.log('Created dist/404.html for SPA deep-link fallback.');
