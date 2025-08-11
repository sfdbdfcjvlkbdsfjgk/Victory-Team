import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
  // server:{
  //   hmr:{
  //     overlay:false
  //   }
  // }
=======
  server: {
    port: 5174,
    // hmr:{
    //   overlay:false
    // }
  }
>>>>>>> origin/fjl
})

