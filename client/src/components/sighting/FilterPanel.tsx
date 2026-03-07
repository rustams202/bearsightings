import { type ChangeEvent } from 'react'
import { Search, X } from 'lucide-react'
import type { SightingFilters } from '../../types/sighting'
import { cn } from '../../lib/utils'

interface FilterPanelProps {
  filters: SightingFilters
  onChange: (filters: SightingFilters) => void
  towns?: string[]
  showStatusFilter?: boolean   // only shown on admin dashboard
  showSearch?: boolean
  compact?: boolean
  className?: string
}

const BEAR_TYPES = [
  { value: '', label: 'Any bear type' },
  { value: 'adult', label: 'Adult' },
  { value: 'cub', label: 'Cub' },
  { value: 'mother_with_cubs', label: 'Mother with cubs' },
  { value: 'unknown', label: 'Unknown' },
]

const BEHAVIORS = [
  { value: '', label: 'Any behavior' },
  { value: 'crossing_road', label: 'Crossing road' },
  { value: 'eating', label: 'Eating / foraging' },
  { value: 'near_trash', label: 'Near trash / food' },
  { value: 'climbing_tree', label: 'Climbing tree' },
  { value: 'resting', label: 'Resting' },
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'calm', label: 'Calm' },
]

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending review' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'flagged', label: 'Flagged' },
]

const LOCATION_TYPES = [
  { value: '', label: 'Any location' },
  { value: 'backyard', label: 'Backyard' },
  { value: 'road', label: 'Road' },
  { value: 'forest', label: 'Forest' },
  { value: 'trail', label: 'Trail' },
  { value: 'farm', label: 'Farm' },
  { value: 'neighborhood', label: 'Neighborhood' },
  { value: 'campsite', label: 'Campsite' },
  { value: 'other', label: 'Other' },
]

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        className="field-input"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function FilterPanel({
  filters,
  onChange,
  towns = [],
  showStatusFilter = false,
  showSearch = false,
  compact = false,
  className,
}: FilterPanelProps) {
  const set = (key: keyof SightingFilters, value: string) =>
    onChange({ ...filters, [key]: value })

  const hasActiveFilters = Object.values(filters).some((v) => v && v !== '')

  const townOptions = [
    { value: '', label: 'Any town' },
    ...towns.map((t) => ({ value: t, label: t })),
  ]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={() => onChange({})}
            className="flex items-center gap-1 text-xs text-forest-600 hover:text-forest-700 font-medium"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search town, name, or notes…"
            value={filters.search ?? ''}
            onChange={(e) => set('search', e.target.value)}
            className="field-input pl-9"
          />
        </div>
      )}

      {/* Date range */}
      <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
        <div>
          <label className="field-label">From date</label>
          <input
            type="date"
            value={filters.date_from ?? ''}
            onChange={(e) => set('date_from', e.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label">To date</label>
          <input
            type="date"
            value={filters.date_to ?? ''}
            onChange={(e) => set('date_to', e.target.value)}
            className="field-input"
          />
        </div>
      </div>

      {/* Town */}
      {towns.length > 0 && (
        <SelectField
          label="Town"
          value={filters.town ?? ''}
          onChange={(v) => set('town', v)}
          options={townOptions}
        />
      )}

      {/* Bear type */}
      <SelectField
        label="Bear type"
        value={filters.bear_type ?? ''}
        onChange={(v) => set('bear_type', v)}
        options={BEAR_TYPES}
      />

      {/* Behavior */}
      <SelectField
        label="Behavior"
        value={filters.behavior ?? ''}
        onChange={(v) => set('behavior', v)}
        options={BEHAVIORS}
      />

      {/* Location type */}
      <SelectField
        label="Location type"
        value={filters.location_type ?? ''}
        onChange={(v) => set('location_type', v)}
        options={LOCATION_TYPES}
      />

      {/* Status — admin only */}
      {showStatusFilter && (
        <SelectField
          label="Review status"
          value={filters.status ?? ''}
          onChange={(v) => set('status', v)}
          options={STATUSES}
        />
      )}
    </div>
  )
}
