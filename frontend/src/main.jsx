// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/globals.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 
      BrowserRouter must wrap the entire app so any component
      can use useNavigate, useLocation, Link, etc.
      In production, your server must redirect all paths to index.html
      so React Router can handle client-side navigation.
    */}
    <BrowserRouter>
      <App />
      {/* 
        Toaster renders toast notifications at the root level
        so any component can trigger them without prop drilling.
        position="top-right" is the SOC dashboard convention.
      */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0a1628',
            color: '#e2e8f0',
            border: '1px solid #1a2d4a',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#00ff88', secondary: '#050d1a' },
          },
          error: {
            iconTheme: { primary: '#ff3366', secondary: '#050d1a' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)