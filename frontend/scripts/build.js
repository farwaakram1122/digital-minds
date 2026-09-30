import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vite = path.join(frontend, 'node_modules', 'vite', 'bin', 'vite.js');
const build = spawnSync(process.execPath, [vite, 'build'], { cwd: frontend, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status || 1);

// Netlify proxies the API and HTML panels through the public site domain.
const backend = process.env.BACKEND_URL?.replace(/\/$/, '');
if (backend && !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(backend))
  throw new Error('BACKEND_URL must be the public HTTPS backend origin');
const paths = ['/api', '/panels', '/CSS', '/JS', '/images'];
const rules = backend ? paths.map(prefix => `${prefix}/* ${backend}${prefix}/:splat 200`) : [];
fs.writeFileSync(path.join(frontend, 'dist', '_redirects'), [...rules, '/* /index.html 200', ''].join('\n'));
