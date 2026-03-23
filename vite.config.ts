import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.NVIDIA_NIM_API_KEY': JSON.stringify(env.NVIDIA_NIM_API_KEY),
  'process.env.USE_NVIDIA_NIM': JSON.stringify(env.USE_NVIDIA_NIM === 'true'),
  'process.env.VITE_VISION_MODEL': JSON.stringify(env.VITE_VISION_MODEL),
  'process.env.VITE_DETECTOR_MODEL': JSON.stringify(env.VITE_DETECTOR_MODEL),
  'process.env.VITE_NUANCE_MODEL': JSON.stringify(env.VITE_NUANCE_MODEL),
  'process.env.VITE_ORCHESTRATOR_MODEL': JSON.stringify(env.VITE_ORCHESTRATOR_MODEL),
},

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
