import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Fonts are served from this site, trimmed to the weights in use.
// All three cover Latin, Cyrillic and the Uzbek letter ʻ (U+02BB).
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource-variable/onest/index.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/scrub.css'
import './styles/home.css'
import './styles/pages.css'
import './styles/modal.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
