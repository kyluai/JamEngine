import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      'process.env': env,
      'import.meta.env': {
        VITE_APPLE_MUSIC_DEVELOPER_TOKEN: env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN,
        VITE_APPLE_MUSIC_TEAM_ID: env.VITE_APPLE_MUSIC_TEAM_ID,
        VITE_APPLE_MUSIC_KEY_ID: env.VITE_APPLE_MUSIC_KEY_ID,
        VITE_APPLE_MUSIC_PRIVATE_KEY: env.VITE_APPLE_MUSIC_PRIVATE_KEY,
        VITE_SOUNDCLOUD_CLIENT_ID: env.VITE_SOUNDCLOUD_CLIENT_ID,
        VITE_SOUNDCLOUD_CLIENT_SECRET: env.VITE_SOUNDCLOUD_CLIENT_SECRET,
        VITE_SOUNDCLOUD_REDIRECT_URI: env.VITE_SOUNDCLOUD_REDIRECT_URI
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            music: ['axios', 'jsonwebtoken']
          }
        }
      }
    }
  };
});