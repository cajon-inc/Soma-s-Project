import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src')
    }
  },
  // ベースパスを設定して、ソースコードのパスを正しく解決できるようにする
  base: '/',
  // ビルド設定を明示的に指定
  build: {
    outDir: 'dist'
  }
})