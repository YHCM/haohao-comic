import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 配置路径别名
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // 允许所有域名访问
    allowedHosts: true,
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
