import { useEffect, useState } from 'react'
import { Download, SlidersHorizontal, X, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import FilterPanel from '../components/sighting/FilterPanel'
import SightingTable from '../components/sighting/SightingTable'
import { StatusBadge } from '../components/ui/Badge'
import { fetchAdminSightings, fetchAdminStats, fetchTowns, downloadCsv, updateSightingStatus } from '../lib/api'
import type { AdminStats, Sighting, SightingFilters } from '../types/sighting'

// ---------------------------------------------------------------------------
// Research / Admin Dashboard
// NOTE: This page is currently unprotected (no login required).
// To add password protection, see server/src/middleware/ and src/lib/api.ts.
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const navigate = useNavigate()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [towns, setTowns] = useState<string[]>([])
  const [filters, setFilters] = useState<SightingFilters>({})
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetchAdminSightings(filters),
      fetchAdminStats(),
      fetchTowns(),
    ])
      .then(([s, st, t]) => {
        setSightings(s)
        setStats(st)
        setTowns(t)
      })
      .catch(() => setError('Could not load data. Is the server running?'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkReviewed = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await updateSightingStatus(id, { status: 'reviewed' })
    loadData()
  }

  const handleFlag = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await updateSightingStatus(id, { status: 'flagged', is_duplicate: true })
    loadData()
  }

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Research Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Review and manage bear sighting reports.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCsv}>
            <Download size={14} />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((v) => !v)}
            className="relative"
          >
            <SlidersHorizontal size={14} />
            Filters
            {Object.values(filters).some(Boolean) && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-forest-500 text-white text-[10px] font-bold flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error} <button className="ml-2 underline" onClick={loadData}>Try again</button>
        </div>
      )}

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            emoji="🐻"
            label="Total sightings"
            value={stats.total}
            color="text-forest-600"
          />
          <StatCard
            emoji="📅"
            label="This week"
            value={stats.this_week}
            color="text-blue-600"
          />
          <StatCard
            emoji="⏳"
            label="Pending review"
            value={stats.pending}
            color="text-amber-600"
            highlight={stats.pending > 0}
          />
          <StatCard
            emoji="📍"
            label="Top town"
            value={stats.top_towns?.[0]?.town ?? '—'}
            isText
            color="text-purple-600"
          />
        </div>
      )}

      {/* ── Top towns + behaviors ────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Towns</h3>
            <div className="space-y-2">
              {stats.top_towns.map((t, i) => (
                <div key={t.town} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-gray-700">{t.town}</span>
                      <span className="text-xs text-gray-400">{t.count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-forest-400"
                        style={{ width: `${Math.min(100, (t.count / (stats.top_towns[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Common Behaviors</h3>
            <div className="space-y-2">
              {stats.top_behaviors.map((b, i) => (
                <div key={b.behavior} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {b.behavior.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400">{b.count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-amber-400"
                        style={{ width: `${Math.min(100, (b.count / (stats.top_behaviors[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Filter panel (collapsible) ────────────────────────────────────── */}
      {filtersOpen && (
        <Card className="mb-6 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Filters</h2>
            <button onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            towns={towns}
            showStatusFilter
            showSearch
            compact
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          />
        </Card>
      )}

      {/* ── Sightings table ──────────────────────────────────────────────── */}
      <Card>
        <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">All Reports</h2>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">{sightings.length} {sightings.length === 1 ? 'report' : 'reports'} shown</p>
            )}
          </div>

          {/* Quick status filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {(['', 'pending', 'reviewed', 'flagged'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilters({ ...filters, status: s })}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  filters.status === s
                    ? 'bg-forest-600 text-white border-forest-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <PageSpinner />
          ) : (
            <AdminSightingTable
              sightings={sightings}
              onRowClick={(s) => navigate(`/sighting/${s.id}`)}
              onMarkReviewed={handleMarkReviewed}
              onFlag={handleFlag}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stats card
// ---------------------------------------------------------------------------
function StatCard({
  emoji,
  label,
  value,
  color,
  isText = false,
  highlight = false,
}: {
  emoji: string
  label: string
  value: number | string
  color: string
  isText?: boolean
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-amber-200 bg-amber-50' : ''}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`mt-1.5 font-bold ${isText ? 'text-xl' : 'text-3xl'} ${color}`}>{value}</p>
          </div>
          <span className="text-2xl" role="img" aria-hidden="true">{emoji}</span>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Admin table with action buttons
// ---------------------------------------------------------------------------
function AdminSightingTable({
  sightings,
  onRowClick,
  onMarkReviewed,
  onFlag,
}: {
  sightings: Sighting[]
  onRowClick: (s: Sighting) => void
  onMarkReviewed: (id: string, e: React.MouseEvent) => void
  onFlag: (id: string, e: React.MouseEvent) => void
}) {
  if (sightings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="text-4xl mb-3">🐻</span>
        <p className="text-gray-500 font-medium">No reports found.</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Location</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Bear</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Reported by</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sightings.map((s) => (
            <tr
              key={s.id}
              onClick={() => onRowClick(s)}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <td className="py-3.5 pr-4">
                <p className="font-medium text-gray-900">
                  {new Date(s.sighting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-gray-400">{s.sighting_time}</p>
              </td>
              <td className="py-3.5 pr-4">
                <p className="font-medium text-gray-900">{s.town}</p>
                <p className="text-xs text-gray-400 capitalize">{s.location_type.replace(/_/g, ' ')}</p>
              </td>
              <td className="py-3.5 pr-4">
                <p className="text-gray-700">
                  {s.bear_type.replace(/_/g, ' ')}{s.bear_count > 1 ? ` ×${s.bear_count}` : ''}
                </p>
              </td>
              <td className="py-3.5 pr-4">
                <p className="text-gray-700">{s.submitter_name}</p>
                {s.submitter_email && <p className="text-xs text-gray-400">{s.submitter_email}</p>}
              </td>
              <td className="py-3.5 pr-4">
                <StatusBadge status={s.status} />
              </td>
              <td className="py-3.5">
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {s.status === 'pending' && (
                    <button
                      onClick={(e) => onMarkReviewed(s.id, e)}
                      className="rounded-lg border border-forest-200 bg-forest-50 px-2.5 py-1 text-xs font-medium text-forest-700 hover:bg-forest-100 transition-colors"
                    >
                      Review
                    </button>
                  )}
                  {s.status !== 'flagged' && (
                    <button
                      onClick={(e) => onFlag(s.id, e)}
                      className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Flag
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
