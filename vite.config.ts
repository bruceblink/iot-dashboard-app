import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7654,        // 指定端口
    strictPort: false,  // 如果端口被占用，自动寻找下一个端口
    open: true,        // 启动后自动打开浏览器
  },
})
