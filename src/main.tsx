import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { captureInstallPrompt } from './lib/install'
import { startPwa } from './lib/pwa'

captureInstallPrompt()
startPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
