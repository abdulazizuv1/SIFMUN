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

/* Photo skeletons. Every photo frame shimmers until its image arrives, then the image
   fades in. One listener for the whole site (load and error do not bubble, so it
   listens in the capture phase); the CSS lives in styles/modal.css. */
const markLoaded = (e: Event) => {
  const img = e.target
  if (!(img instanceof HTMLImageElement)) return
  img.classList.add('is-loaded')
  img.parentElement?.classList.add('img-ready')
}
document.addEventListener('load', markLoaded, true)
document.addEventListener('error', markLoaded, true)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
