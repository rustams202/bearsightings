import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'

// Pages that use the full viewport height (map, report form)
const FULL_HEIGHT_PAGES = ['/map']

export default function Layout() {
  const location = useLocation()
  const isFullHeight = FULL_HEIGHT_PAGES.includes(location.pathname)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className={isFullHeight ? 'flex flex-1 flex-col' : 'flex-1'}>
        <Outlet />
      </main>
      {!isFullHeight && (
        <footer className="mt-auto border-t border-gray-100 bg-white py-6 text-center text-sm text-gray-400">
          <p>
            BearWatch Vermont &mdash; A wildlife research initiative.
            {/* To update footer branding, edit this file: src/components/layout/Layout.tsx */}
          </p>
        </footer>
      )}
    </div>
  )
}
