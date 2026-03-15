import { useEffect, useState } from 'react'
import { List, Map as MapIcon, SlidersHorizontal, X } from 'lucide-react'
import SightingMap, { MapLegend } from '../components/map/SightingMap'
import SightingTable from '../components/sighting/SightingTable'
import FilterPanel from '../components/sighting/FilterPanel'
import { PageSpinner } from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import { fetchSightings, fetchTowns } from '../lib/api'
import type { Sighting, SightingFilters } from '../types/sighting'

type ViewMode = 'map' | 'list' | 'split'

export default function MapPage() {
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [towns, setTowns] = useState<string[]>([])
  const [filters, setFilters] = useState<SightingFilters>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load towns for filter dropdown (once)
  useEffect(() => {
    fetchTowns().then(setTowns).catch(() => null)
  }, [])

  // Reload sightings whenever filters change
  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchSightings(filters)
      .then(setSightings)
      .catch(() => setError('Could not load sightings. Is the server running?'))
      .finally(() => setLoading(false))
  }, [filters])

  const mappable = sightings.filter((s) => s.latitude && s.longitude)
  const unmappable = sightings.filter((s) => !s.latitude || !s.longitude)

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-gray-900 text-sm sm:text-base">
            Bear Sightings Map
          </h1>
          {!loading && (
            <span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-medium text-forest-700">
              {sightings.length} {sightings.length === 1 ? 'sighting' : 'sightings'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-gray-200 p-0.5 bg-white">
            {([
              { mode: 'map' as ViewMode,   icon: <MapIcon size={15} />,   label: 'Map' },
              { mode: 'split' as ViewMode, icon: null,                    label: 'Split' },
              { mode: 'list' as ViewMode,  icon: <List size={15} />,      label: 'List' },
            ] as const).map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-forest-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filters toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen((v) => !v)}
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

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Filter sidebar */}
        {sidebarOpen && (
          <div className="absolute inset-y-0 right-0 z-20 w-72 bg-white border-l border-gray-100 shadow-lg overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              towns={towns}
            />
          </div>
        )}

        {/* Map + List */}
        {error ? (
          <div className="flex flex-1 items-center justify-center text-center p-8">
            <div>
              <p className="text-gray-500 font-medium mb-1">{error}</p>
              <p className="text-sm text-gray-400">Make sure the backend server is running.</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center">
            <PageSpinner />
          </div>
        ) : (
          <div className={`flex flex-1 overflow-hidden ${viewMode === 'split' ? 'flex-col sm:flex-row' : 'flex-col'}`}>
            {/* Map panel */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <div className={`relative ${viewMode === 'split' ? 'h-[50vh] sm:h-auto sm:flex-1' : 'flex-1'}`}>
                <SightingMap sightings={sightings} height="100%" />
                <MapLegend />
                {mappable.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 text-center shadow-card">
                      <p className="text-sm font-medium text-gray-700">No GPS data for current filters</p>
                      <p className="text-xs text-gray-400 mt-0.5">Sightings without coordinates won't appear on the map</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List panel */}
            {(viewMode === 'list' || viewMode === 'split') && (
              <div className={`bg-white overflow-y-auto border-t border-gray-100 sm:border-t-0 sm:border-l ${viewMode === 'split' ? 'h-[50vh] sm:h-auto sm:w-96' : 'flex-1'}`}>
                <div className="p-4 sm:p-5">
                  {sightings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="text-4xl mb-3">🐻</span>
                      <p className="text-gray-500 font-medium">No sightings found</p>
                      <button
                        onClick={() => setFilters({})}
                        className="mt-2 text-sm text-forest-600 hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <>
                      <SightingTable sightings={sightings} />
                      {unmappable.length > 0 && (
                        <p className="mt-4 text-xs text-gray-400 text-center">
                          {unmappable.length} sighting{unmappable.length > 1 ? 's' : ''} not shown on map (no GPS)
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
