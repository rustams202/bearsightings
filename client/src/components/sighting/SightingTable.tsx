import { useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import type { Sighting } from '../../types/sighting'
import { BEHAVIOR_LABELS, BEAR_TYPE_LABELS } from '../../types/sighting'
import { StatusBadge, BearTypeBadge } from '../ui/Badge'
import { formatDate, formatTime, truncate } from '../../lib/utils'

interface SightingTableProps {
  sightings: Sighting[]
  isAdmin?: boolean
  onRowClick?: (sighting: Sighting) => void
  emptyMessage?: string
}

export default function SightingTable({
  sightings,
  isAdmin = false,
  onRowClick,
  emptyMessage = 'No sightings found.',
}: SightingTableProps) {
  const navigate = useNavigate()

  const handleClick = (s: Sighting) => {
    if (onRowClick) {
      onRowClick(s)
    } else {
      navigate(`/sighting/${s.id}`)
    }
  }

  if (sightings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3" role="img" aria-label="bear">🐻</span>
        <p className="text-gray-500 font-medium">{emptyMessage}</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date & Time</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Location</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Bear</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Behavior</th>
            {isAdmin && (
              <>
                <th className="pb-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Submitted by</th>
                <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
              </>
            )}
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sightings.map((s) => (
            <tr
              key={s.id}
              onClick={() => handleClick(s)}
              className="cursor-pointer hover:bg-gray-50 transition-colors group"
            >
              {/* Date & time */}
              <td className="py-3.5 pr-4">
                <p className="font-medium text-gray-900">{formatDate(s.sighting_date)}</p>
                <p className="text-gray-400 text-xs">{formatTime(s.sighting_time)}</p>
              </td>

              {/* Location */}
              <td className="py-3.5 pr-4">
                <div className="flex items-start gap-1">
                  <MapPin size={13} className="mt-0.5 text-gray-300 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{s.town}</p>
                    <p className="text-gray-400 text-xs capitalize">{s.location_type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </td>

              {/* Bear info */}
              <td className="py-3.5 pr-4">
                <BearTypeBadge type={s.bear_type} />
                {s.bear_count > 1 && (
                  <span className="ml-1.5 text-xs text-gray-500">&times;{s.bear_count}</span>
                )}
              </td>

              {/* Behaviors */}
              <td className="py-3.5 pr-4">
                <p className="text-gray-700">
                  {s.behaviors
                    .slice(0, 2)
                    .map((b) => BEHAVIOR_LABELS[b] ?? b)
                    .join(', ')}
                  {s.behaviors.length > 2 && (
                    <span className="text-gray-400"> +{s.behaviors.length - 2}</span>
                  )}
                </p>
              </td>

              {/* Admin-only columns */}
              {isAdmin && (
                <>
                  <td className="py-3.5 pr-4">
                    <p className="text-gray-700">{truncate(s.submitter_name, 20)}</p>
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={s.status} />
                    {s.is_duplicate && (
                      <span className="ml-1.5 text-xs text-orange-600 font-medium">Dupe</span>
                    )}
                  </td>
                </>
              )}

              {/* Arrow */}
              <td className="py-3.5 text-right">
                <ArrowRight size={15} className="text-gray-300 group-hover:text-forest-500 transition-colors ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
