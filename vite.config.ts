import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/TaskFlow-Intelligent-To-Do-Management-Platform/',
})
