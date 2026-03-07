import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import type { Sighting } from '../../types/sighting'
import { BEAR_TYPE_LABELS, BEHAVIOR_LABELS } from '../../types/sighting'
import { formatDate, formatTime } from '../../lib/utils'

// Vermont map center and default zoom
// To change the map region, update these values
const VERMONT_CENTER: [number, number] = [44.0, -72.7]
const DEFAULT_ZOOM = 8

interface SightingMapProps {
  sightings: Sighting[]
  height?: string
}

// Color-codes markers by bear type
function markerColor(s: Sighting): string {
  if (s.bear_type === 'mother_with_cubs') return '#9333ea' // purple
  if (s.bear_type === 'cub')              return '#3b82f6' // blue
  if (s.behaviors.includes('aggressive')) return '#ef4444' // red
  return '#1a5c38'                                          // forest green (default)
}

// Automatically adjusts map view when sightings change
function MapBoundsUpdater({ sightings }: { sightings: Sighting[] }) {
  const map = useMap()
  useEffect(() => {
    const mapped = sightings.filter((s) => s.latitude && s.longitude)
    if (mapped.length === 0) {
      map.setView(VERMONT_CENTER, DEFAULT_ZOOM)
      return
    }
    if (mapped.length === 1) {
      map.setView([mapped[0].latitude!, mapped[0].longitude!], 12)
      return
    }
    // Fit the map to contain all markers
    const lats = mapped.map((s) => s.latitude!)
    const lngs = mapped.map((s) => s.longitude!)
    map.fitBounds([
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ], { padding: [40, 40] })
  }, [sightings, map])

  return null
}

export default function SightingMap({ sightings, height = '100%' }: SightingMapProps) {
  const navigate = useNavigate()
  const mappable = sightings.filter((s) => s.latitude && s.longitude)

  return (
    <MapContainer
      center={VERMONT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height, width: '100%' }}
      className="z-0"
    >
      {/* OpenStreetMap tiles — free, no API key required */}
      {/* To switch to a different map style, replace this TileLayer URL */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater sightings={sightings} />

      {mappable.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.latitude!, s.longitude!]}
          radius={s.bear_count > 1 ? 10 : 8}
          pathOptions={{
            color: '#fff',
            weight: 2,
            fillColor: markerColor(s),
            fillOpacity: 0.85,
          }}
        >
          <Popup minWidth={220}>
            <div className="p-3">
              {/* Header */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-lg" role="img" aria-label="bear">🐻</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{s.town}, {s.state}</p>
                  <p className="text-gray-500 text-xs">{formatDate(s.sighting_date)} &middot; {formatTime(s.sighting_time)}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1 text-xs text-gray-600 border-t border-gray-100 pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bear</span>
                  <span className="font-medium">{BEAR_TYPE_LABELS[s.bear_type]}{s.bear_count > 1 ? ` ×${s.bear_count}` : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location</span>
                  <span className="font-medium capitalize">{s.location_type.replace(/_/g, ' ')}</span>
                </div>
                {s.behaviors.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Behavior</span>
                    <span className="font-medium text-right max-w-[120px]">
                      {s.behaviors.slice(0, 2).map((b) => BEHAVIOR_LABELS[b]).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Link to detail */}
              <button
                onClick={() => navigate(`/sighting/${s.id}`)}
                className="mt-3 w-full rounded-lg bg-forest-600 py-1.5 text-xs font-semibold text-white hover:bg-forest-700 transition-colors"
              >
                View full report
              </button>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

// Legend component for the map page
export function MapLegend() {
  const items = [
    { color: '#1a5c38', label: 'Adult bear' },
    { color: '#9333ea', label: 'Mother with cubs' },
    { color: '#3b82f6', label: 'Cub' },
    { color: '#ef4444', label: 'Aggressive behavior' },
  ]
  return (
    <div className="absolute bottom-8 left-4 z-10 rounded-xl bg-white/95 backdrop-blur-sm border border-gray-100 shadow-card px-3 py-2.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Legend</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
