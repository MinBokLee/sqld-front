import { defineConfig, loadEnv } from 'vite' 
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({mode}) =>{
  const env = loadEnv(mode, process.cwd(), '');
  console.log('--- Vite Startup Info ---');
  console.log('Current Mode:', mode);
  console.log('Target API URL:', env.VITE_API_BASE_URL);
  console.log('-------------------------');

  const target = env.VITE_API_BASE_URL || 'http://175.197.69.42:8881';

  return { 
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
          secure: false
        },
        '/uploads': {
          target: target,
          changeOrigin: true,
          secure: false
        },
      },
     },
    }
})
