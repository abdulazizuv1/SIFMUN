import { Suspense, lazy, useEffect, useLayoutEffect } from 'react'
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Environment } from './components/Environment'
import { Footer } from './components/Footer'
import { Nav } from './components/Nav'
import { DocLabel } from './components/ui'
import { ContentProvider } from './data/content'
import { I18nProvider, useI18n } from './i18n'
import { installVisibilityPause } from './lib/motion'
import { History } from './pages/History'
import { Home } from './pages/Home'
import { Register } from './pages/Register'
import { Team } from './pages/Team'

// The admin is its own chunk: visitors never download it.
const Admin = lazy(() => import('./admin/Admin'))

function Layout() {
  const { pathname, hash } = useLocation()

  // New page: start at the top and move focus to the content, unless a #section was asked for.
  useLayoutEffect(() => {
    if (hash) return
    window.scrollTo(0, 0)
  }, [pathname, hash])

  useEffect(() => installVisibilityPause(), [])

  // The home page opens on a dark hero, so the nav starts light-on-dark there.
  const home = pathname === '/'

  return (
    <div className={`shell ${home ? 'shell--home' : ''}`}>
      <Environment />
      <Nav />
      <main id="main" tabIndex={-1} key={pathname} className="page">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function NotFound() {
  const { t } = useI18n()
  return (
    <header className="pagehead pagehead--solo">
      <DocLabel>SIFMUN/404</DocLabel>
      <h1 className="pagehead__plain">{t('notFound.title')}</h1>
      <Link to="/" className="link">
        {t('notFound.back')}
      </Link>
    </header>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <ContentProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/team" element={<Team />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={null}>
                  <Admin />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </ContentProvider>
    </I18nProvider>
  )
}
