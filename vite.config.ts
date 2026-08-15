import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function copyImagesPlugin() {
  return {
    name: 'copy-images-plugin',
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'images')
      const destDir = path.resolve(__dirname, 'dist/images')
      if (fs.existsSync(srcDir)) {
        fs.cpSync(srcDir, destDir, { recursive: true })
      }
    }
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    copyImagesPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html'),
        adminLogin: path.resolve(__dirname, 'admin-login.html'),
        checkout: path.resolve(__dirname, 'checkout.html'),
        shoppingGuide: path.resolve(__dirname, 'shopping-guide.html'),
        trackOrder: path.resolve(__dirname, 'track-order.html'),
      },
    },
  },
})

