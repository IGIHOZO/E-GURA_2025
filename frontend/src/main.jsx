import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// import './utils/pwaInstaller.js' // Disabled to prevent browser install UI
// import { initializePWAAssets } from './utils/createAppIcons.js' // Disabled

// Initialize PWA assets (icons, manifest, meta tags) - DISABLED
// initializePWAAssets();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 