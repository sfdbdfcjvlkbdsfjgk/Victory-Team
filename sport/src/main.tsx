import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router/index.ts'
import { suppressKnownWarnings } from './utils/suppressWarnings'
import './index.css'
import 'animate.css'

// 抑制已知的兼容性警告
suppressKnownWarnings();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)


