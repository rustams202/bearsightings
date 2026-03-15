import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const navLinks = [
  { to: '/map', label: 'View Map' },
  { to: '/dashboard', label: 'Research Dashboard' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isReportPage = location.pathname === '/report'

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
            <span className="text-2xl" role="img" aria-label="bear">
              🐻
            </span>
            <div className="leading-tight">
              <span className="font-semibold text-gray-900 text-sm sm:text-base group-hover:text-forest-600 transition-colors">
                BearWatch
              </span>
              <span className="text-forest-600 font-semibold text-sm sm:text-base"> Vermont</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-forest-50 text-forest-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            {!isReportPage && (
              <Link
                to="/report"
                className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-forest-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-forest-700 active:bg-forest-800 transition-colors"
              >
                Report a Sighting
              </Link>
            )}
          </nav>

          {/* Mobile: report button + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            {!isReportPage && (
              <Link
                to="/report"
                className="inline-flex items-center rounded-lg bg-forest-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-forest-700 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Report
              </Link>
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-forest-50 text-forest-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
