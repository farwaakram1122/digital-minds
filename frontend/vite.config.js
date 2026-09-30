import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const backend = env.VITE_BACKEND_URL || 'http://localhost:5000';

  const proxy = Object.fromEntries(
    ['/api', '/panels', '/CSS', '/JS', '/images'].map(path => [path, backend])
  );

  return {
    plugins: [react()],
    server: {
      allowedHosts: ['.trycloudflare.com'],
      proxy
    }
  };
});