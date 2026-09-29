import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // ใช้ path แบบ relative เสมอ ไม่ผูกกับชื่อ repo — กัน bug หน้าว่างจาก base path ผิด
  base: "./",
  plugins: [react()],
})
