/**
 * API client
 * All communication with the Express backend goes through these functions.
 * To point at a different backend URL (e.g. a hosted server), change API_BASE.
 */

import type { AdminStats, Sighting, SightingFilters, SightingFormData } from '../types/sighting'
import { buildQueryString } from './utils'

// In development, Vite proxies /api to localhost:3001
// In production, the Express server handles /api directly
const API_BASE = '/api'

// ---------------------------------------------------------------------------
// Public — sighting submission and listing
// ---------------------------------------------------------------------------

export async function submitSighting(data: SightingFormData): Promise<Sighting> {
  const formData = new FormData()

  // Append all scalar fields
  const { photo, behaviors, ...rest } = data
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  }

  // Behaviors is an array — serialize to JSON for the multipart form
  formData.append('behaviors', JSON.stringify(behaviors))

  // Attach photo if provided
  if (photo) {
    formData.append('photo', photo)
  }

  const res = await fetch(`${API_BASE}/sightings`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to submit sighting')
  }

  return res.json()
}

export async function fetchSightings(filters?: SightingFilters): Promise<Sighting[]> {
  const qs = buildQueryString({
    town: filters?.town,
    date_from: filters?.date_from,
    date_to: filters?.date_to,
    bear_type: filters?.bear_type,
    behavior: filters?.behavior,
    location_type: filters?.location_type,
  })
  const res = await fetch(`${API_BASE}/sightings${qs}`)
  if (!res.ok) throw new Error('Failed to fetch sightings')
  return res.json()
}

export async function fetchSighting(id: string): Promise<Sighting> {
  const res = await fetch(`${API_BASE}/sightings/${id}`)
  if (!res.ok) throw new Error('Sighting not found')
  return res.json()
}

// ---------------------------------------------------------------------------
// Admin — dashboard, moderation, export
// ---------------------------------------------------------------------------

export async function fetchAdminSightings(filters?: SightingFilters): Promise<Sighting[]> {
  const qs = buildQueryString({
    search: filters?.search,
    town: filters?.town,
    date_from: filters?.date_from,
    date_to: filters?.date_to,
    bear_type: filters?.bear_type,
    behavior: filters?.behavior,
    location_type: filters?.location_type,
    status: filters?.status,
  })
  const res = await fetch(`${API_BASE}/admin/sightings${qs}`)
  if (!res.ok) throw new Error('Failed to fetch admin sightings')
  return res.json()
}

export async function fetchAdminSighting(id: string): Promise<Sighting> {
  const res = await fetch(`${API_BASE}/admin/sightings/${id}`)
  if (!res.ok) throw new Error('Sighting not found')
  return res.json()
}

export async function updateSightingStatus(
  id: string,
  update: { status?: 'pending' | 'reviewed' | 'flagged'; reviewer_notes?: string; is_duplicate?: boolean; duplicate_of?: string | null }
): Promise<Sighting> {
  const res = await fetch(`${API_BASE}/admin/sightings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  })
  if (!res.ok) throw new Error('Failed to update sighting')
  return res.json()
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchTowns(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/admin/towns`)
  if (!res.ok) return []
  return res.json()
}

// Triggers a CSV file download in the browser
export function downloadCsv() {
  const link = document.createElement('a')
  link.href = `${API_BASE}/admin/export`
  link.download = 'bear-sightings.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
