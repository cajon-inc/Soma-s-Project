import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // Tailwind & reset

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)