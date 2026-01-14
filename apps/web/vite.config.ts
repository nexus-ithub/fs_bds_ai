// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 현재 모드(dev/prod 등)에 맞게 .env 로드
  // 세 번째 인자를 ''로 주면 VITE_ 접두사 여부와 상관없이 모두 읽어옴.
  const env = loadEnv(mode, process.cwd(), '')

  // public/version.json 읽기
  const versionPath = path.resolve(__dirname, 'public/version.json')
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'))

  return {
    plugins: [
      react(),
      tailwindcss(),
      createHtmlPlugin({
        inject: {
          data: {
            VITE_KAKAO_KEY: env.VITE_KAKAO_KEY ?? '',
          },
        },
      }),
    ],
    define: {
      '__APP_VERSION__': JSON.stringify(versionData.version),
    },
    server: {
      port: 3000,
      host: true, // ngrok
      allowedHosts: ['265ac29d1ca2.ngrok-free.app'], // ngrok
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
  }
})
