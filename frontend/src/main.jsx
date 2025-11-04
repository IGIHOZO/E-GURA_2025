import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { reportWebVitals } from './utils/webVitals'

// Initialize Web Vitals monitoring
reportWebVitals((metric) => {
  console.log('📊 Web Vital:', metric.name, metric.value);
});
 
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 
