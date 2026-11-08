import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import TrayPopupPage from './components/TrayPopupPage.tsx'

// Tray popup window (Tauri label "tray-popup", url index.html?tray=1):
// renders ONLY the popup page, not the main app.
const isTrayPopup =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('tray') === '1'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isTrayPopup ? <TrayPopupPage /> : <App />}</StrictMode>,
)
