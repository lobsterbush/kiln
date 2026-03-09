import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// SPA redirect handler for GitHub Pages 404.html
;(function () {
  const redirect = sessionStorage.redirect
  delete sessionStorage.redirect
  if (redirect && redirect !== location.href) {
    history.replaceState(null, '', redirect)
  }

  // Handle the /?/ redirect from 404.html
  const { search } = window.location
  if (search.startsWith('?/')) {
    const decoded = search
      .slice(1)
      .replace(/~and~/g, '&')
    history.replaceState(null, '', import.meta.env.BASE_URL + decoded)
  }
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
