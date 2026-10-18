import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Tipografías del diseño, incluidas en la app (no se piden a Google Fonts).
import '@fontsource/cal-sans/400.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/600.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
