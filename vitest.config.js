import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /\.(m?ts|[jt]sx?)$/,
    exclude: [],
  },
  resolve: {
    alias: {
      'react-dom/client': path.resolve(
        __dirname,
        'src/test/react-dom-client-shim.js'
      ),
      components: path.resolve(__dirname, 'src/components'),
      constants: path.resolve(__dirname, 'src/constants'),
      context: path.resolve(__dirname, 'src/context'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      lib: path.resolve(__dirname, 'src/lib'),
      styles: path.resolve(__dirname, 'src/styles'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
