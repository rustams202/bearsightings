/**
 * Admin / researcher routes
 * All routes are prefixed with /api/admin
 *
 * NOTE: These routes are currently unprotected for the MVP.
 * TODO: Add authentication middleware before deploying publicly.
 *       See server/src/middleware/ for where to add auth.
 *
 * GET    /api/admin/sightings        — all sightings (including pending)
 * GET    /api/admin/sightings/:id    — single sighting full detail
 * PATCH  /api/admin/sightings/:id    — update status / reviewer notes
 * GET    /api/admin/stats            — summary statistics for dashboard
 * GET    /api/admin/export           — download all data as CSV
 * GET    /api/admin/towns            — list of all towns (for filter dropdowns)
 */

import { Router } from 'express'
import { z } from 'zod'
import db from '../db/database'

const router = Router()

// ---------------------------------------------------------------------------
// Helper: transform a DB row into clean API object
// ---------------------------------------------------------------------------
function rowToSighting(row: Record<string, unknown>) {
  return {
    ...row,
    behaviors: typeof row.behaviors === 'string' ? JSON.parse(row.behaviors) : row.behaviors,
    human_food_present: Boolean(row.human_food_present),
    pets_present: Boolean(row.pets_present),
    consent_given: Boolean(row.consent_given),
    is_duplicate: Boolean(row.is_duplicate),
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/sightings — all sightings with optional filters
// ---------------------------------------------------------------------------
router.get('/sightings', (req, res) => {
  const { search, town, date_from, date_to, bear_type, behavior, status, location_type } =
    req.query as Record<string, string>

  let query = `SELECT * FROM sightings WHERE 1=1`
  const params: unknown[] = []

  if (search) {
    query += ` AND (town LIKE ? OR submitter_name LIKE ? OR description LIKE ?)`
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (town) { query += ` AND town LIKE ?`; params.push(`%${town}%`) }
  if (date_from) { query += ` AND sighting_date >= ?`; params.push(date_from) }
  if (date_to) { query += ` AND sighting_date <= ?`; params.push(date_to) }
  if (bear_type) { query += ` AND bear_type = ?`; params.push(bear_type) }
  if (location_type) { query += ` AND location_type = ?`; params.push(location_type) }
  if (behavior) { query += ` AND behaviors LIKE ?`; params.push(`%${behavior}%`) }
  if (status) { query += ` AND status = ?`; params.push(status) }

  query += ` ORDER BY created_at DESC`

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[]
  return res.json(rows.map(rowToSighting))
})

// ---------------------------------------------------------------------------
// GET /api/admin/sightings/:id — full detail for a single sighting
// ---------------------------------------------------------------------------
router.get('/sightings/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM sightings WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined
  if (!row) return res.status(404).json({ error: 'Sighting not found' })
  return res.json(rowToSighting(row))
})

// ---------------------------------------------------------------------------
// PATCH /api/admin/sightings/:id — update status or reviewer notes
// ---------------------------------------------------------------------------
const UpdateSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'flagged']).optional(),
  reviewer_notes: z.string().max(2000).optional(),
  is_duplicate: z.boolean().optional(),
  duplicate_of: z.string().optional().nullable(),
})

router.patch('/sightings/:id', (req, res) => {
  const result = UpdateSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() })
  }

  const existing = db.prepare('SELECT id FROM sightings WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Sighting not found' })

  const updates = result.data
  const fields: string[] = ['updated_at = datetime(\'now\')']
  const values: unknown[] = []

  if (updates.status !== undefined) {
    fields.push('status = ?')
    values.push(updates.status)
    if (updates.status === 'reviewed') {
      fields.push('reviewed_at = datetime(\'now\')')
    }
  }
  if (updates.reviewer_notes !== undefined) {
    fields.push('reviewer_notes = ?')
    values.push(updates.reviewer_notes)
  }
  if (updates.is_duplicate !== undefined) {
    fields.push('is_duplicate = ?')
    values.push(updates.is_duplicate ? 1 : 0)
  }
  if (updates.duplicate_of !== undefined) {
    fields.push('duplicate_of = ?')
    values.push(updates.duplicate_of)
  }

  values.push(req.params.id)
  db.prepare(`UPDATE sightings SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  const updated = db.prepare('SELECT * FROM sightings WHERE id = ?').get(req.params.id) as Record<string, unknown>
  return res.json(rowToSighting(updated))
})

// ---------------------------------------------------------------------------
// GET /api/admin/stats — dashboard summary statistics
// ---------------------------------------------------------------------------
router.get('/stats', (_req, res) => {
  const total = (db.prepare('SELECT COUNT(*) as count FROM sightings').get() as { count: number }).count

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]
  const thisWeek = (
    db.prepare(`SELECT COUNT(*) as count FROM sightings WHERE sighting_date >= ?`).get(weekAgoStr) as {
      count: number
    }
  ).count

  const pending = (
    db.prepare(`SELECT COUNT(*) as count FROM sightings WHERE status = 'pending'`).get() as { count: number }
  ).count

  const topTowns = db
    .prepare(`SELECT town, COUNT(*) as count FROM sightings GROUP BY town ORDER BY count DESC LIMIT 5`)
    .all() as Array<{ town: string; count: number }>

  // Count behaviors — stored as JSON arrays, so we parse in JS
  const allBehaviors = (db.prepare(`SELECT behaviors FROM sightings`).all() as Array<{ behaviors: string }>)
    .flatMap((r) => {
      try { return JSON.parse(r.behaviors) as string[] } catch { return [] }
    })

  const behaviorCounts: Record<string, number> = {}
  for (const b of allBehaviors) {
    behaviorCounts[b] = (behaviorCounts[b] ?? 0) + 1
  }
  const topBehaviors = Object.entries(behaviorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([behavior, count]) => ({ behavior, count }))

  const recentSightings = db
    .prepare(`SELECT * FROM sightings ORDER BY created_at DESC LIMIT 5`)
    .all() as Record<string, unknown>[]

  return res.json({
    total,
    this_week: thisWeek,
    pending,
    top_towns: topTowns,
    top_behaviors: topBehaviors,
    recent: recentSightings.map(rowToSighting),
  })
})

// ---------------------------------------------------------------------------
// GET /api/admin/towns — distinct towns for filter dropdowns
// ---------------------------------------------------------------------------
router.get('/towns', (_req, res) => {
  const towns = db
    .prepare(`SELECT DISTINCT town FROM sightings ORDER BY town`)
    .all() as Array<{ town: string }>
  return res.json(towns.map((r) => r.town))
})

// ---------------------------------------------------------------------------
// GET /api/admin/export — CSV download of all sightings
// ---------------------------------------------------------------------------
router.get('/export', (_req, res) => {
  const rows = db.prepare(`SELECT * FROM sightings ORDER BY sighting_date DESC`).all() as Record<
    string,
    unknown
  >[]

  const headers = [
    'id', 'sighting_date', 'sighting_time', 'town', 'state', 'latitude', 'longitude',
    'location_type', 'bear_count', 'bear_type', 'behaviors', 'distance_ft',
    'human_food_present', 'pets_present', 'description',
    'submitter_name', 'submitter_email', 'status', 'created_at',
  ]

  const escape = (v: unknown) => {
    if (v == null) return ''
    const str = typeof v === 'string' ? v : String(v)
    return `"${str.replace(/"/g, '""')}"`
  }

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="bear-sightings-${Date.now()}.csv"`)
  return res.send(lines.join('\n'))
})

export default router
