import { type ClassValue, clsx } from 'clsx'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import type { BearBehavior, BearType, LocationType, SightingStatus } from '../types/sighting'

// Utility for merging Tailwind class names conditionally
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format an ISO date string for display (e.g. "Aug 15, 2024")
export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

// Format a 24h time string for display (e.g. "7:30 AM")
export function formatTime(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const d = new Date()
    d.setHours(h, m)
    return format(d, 'h:mm a')
  } catch {
    return timeStr
  }
}

// Human-readable relative time (e.g. "3 days ago")
export function timeAgo(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true })
  } catch {
    return isoString
  }
}

// Returns today's date as a YYYY-MM-DD string (for form default values)
export function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

// Returns current time as HH:MM string
export function nowTimeString(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// Tailwind color classes for sighting status badges
export function statusColor(status: SightingStatus): string {
  switch (status) {
    case 'reviewed': return 'bg-forest-100 text-forest-700 border-forest-200'
    case 'flagged':  return 'bg-red-100 text-red-700 border-red-200'
    default:         return 'bg-amber-100 text-amber-700 border-amber-200'
  }
}

// Tailwind color classes for bear type badges
export function bearTypeColor(type: BearType): string {
  switch (type) {
    case 'mother_with_cubs': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'cub':              return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'adult':            return 'bg-forest-100 text-forest-700 border-forest-200'
    default:                 return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

// Tailwind color for location type
export function locationTypeColor(_type: LocationType): string {
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

// Tailwind color for behavior chip
export function behaviorColor(behavior: BearBehavior): string {
  if (behavior === 'aggressive') return 'bg-red-100 text-red-700 border-red-200'
  if (behavior === 'near_trash') return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-forest-50 text-forest-600 border-forest-200'
}

// Build a URL for a uploaded photo
export function photoUrl(filename: string | null): string | null {
  if (!filename) return null
  return `/uploads/${filename}`
}

// Truncate long text for table/card previews
export function truncate(str: string | null | undefined, maxLen = 80): string {
  if (!str) return '—'
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

// Build query string from a filters object, omitting empty values
export function buildQueryString(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v && v.trim() !== '') sp.set(k, v)
  }
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}
