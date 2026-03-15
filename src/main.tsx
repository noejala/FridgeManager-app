import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './i18n'

if ((navigator as any).standalone) {
  document.documentElement.classList.add('pwa');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

