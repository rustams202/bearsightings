/**
 * Public sightings routes
 * POST /api/sightings        — submit a new sighting (with optional photo)
 * GET  /api/sightings        — list sightings (for the public map/list)
 * GET  /api/sightings/:id    — get a single sighting
 */

import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import db, { UPLOADS_DIR } from '../db/database'

const router = Router()

// ---------------------------------------------------------------------------
// File upload configuration (photos stored in server/uploads/)
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

// ---------------------------------------------------------------------------
// Validation schema (mirrors the client-side Zod schema)
// ---------------------------------------------------------------------------
const SightingSchema = z.object({
  sighting_date: z.string().min(1),
  sighting_time: z.string().min(1),
  town: z.string().min(1).max(100),
  state: z.string().default('Vermont'),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  location_type: z.enum(['backyard', 'road', 'forest', 'trail', 'farm', 'neighborhood', 'campsite', 'other']),
  bear_count: z.coerce.number().int().min(1).max(20),
  bear_type: z.enum(['adult', 'cub', 'mother_with_cubs', 'unknown']),
  // behaviors comes in as a JSON string from multipart form
  behaviors: z.string().transform((v) => {
    try { return JSON.parse(v) } catch { return [] }
  }),
  distance_ft: z.coerce.number().int().optional().nullable(),
  human_food_present: z.coerce.boolean(),
  pets_present: z.coerce.boolean(),
  description: z.string().max(2000).optional().nullable(),
  submitter_name: z.string().min(1).max(200),
  submitter_email: z.string().email().optional().nullable().or(z.literal('')),
  consent_given: z.coerce.boolean(),
})

// ---------------------------------------------------------------------------
// Helper: transform a DB row into a clean API response object
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
// POST /api/sightings — submit a new sighting
// ---------------------------------------------------------------------------
router.post('/', upload.single('photo'), (req, res) => {
  const result = SightingSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() })
  }

  const data = result.data
  const id = uuidv4()
  const photo_filename = req.file?.filename ?? null

  const stmt = db.prepare(`
    INSERT INTO sightings (
      id, sighting_date, sighting_time, town, state, latitude, longitude,
      location_type, bear_count, bear_type, behaviors, distance_ft,
      human_food_present, pets_present, description,
      submitter_name, submitter_email, consent_given, photo_filename,
      status
    ) VALUES (
      @id, @sighting_date, @sighting_time, @town, @state, @latitude, @longitude,
      @location_type, @bear_count, @bear_type, @behaviors, @distance_ft,
      @human_food_present, @pets_present, @description,
      @submitter_name, @submitter_email, @consent_given, @photo_filename,
      'pending'
    )
  `)

  stmt.run({
    ...data,
    id,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    distance_ft: data.distance_ft ?? null,
    description: data.description ?? null,
    submitter_email: data.submitter_email ?? null,
    behaviors: JSON.stringify(data.behaviors),
    human_food_present: data.human_food_present ? 1 : 0,
    pets_present: data.pets_present ? 1 : 0,
    consent_given: data.consent_given ? 1 : 0,
    photo_filename,
  })

  const created = db.prepare('SELECT * FROM sightings WHERE id = ?').get(id) as Record<string, unknown>
  return res.status(201).json(rowToSighting(created))
})

// ---------------------------------------------------------------------------
// GET /api/sightings — public list (only reviewed sightings shown publicly)
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  const {
    town,
    date_from,
    date_to,
    bear_type,
    behavior,
    location_type,
    limit = '500',
  } = req.query as Record<string, string>

  let query = `SELECT * FROM sightings WHERE status != 'flagged'`
  const params: unknown[] = []

  if (town) { query += ` AND town LIKE ?`; params.push(`%${town}%`) }
  if (date_from) { query += ` AND sighting_date >= ?`; params.push(date_from) }
  if (date_to) { query += ` AND sighting_date <= ?`; params.push(date_to) }
  if (bear_type) { query += ` AND bear_type = ?`; params.push(bear_type) }
  if (location_type) { query += ` AND location_type = ?`; params.push(location_type) }
  if (behavior) { query += ` AND behaviors LIKE ?`; params.push(`%${behavior}%`) }

  query += ` ORDER BY sighting_date DESC, sighting_time DESC LIMIT ?`
  params.push(parseInt(limit))

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[]
  return res.json(rows.map(rowToSighting))
})

// ---------------------------------------------------------------------------
// GET /api/sightings/:id — single sighting
// ---------------------------------------------------------------------------
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM sightings WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ error: 'Sighting not found' })
  return res.json(rowToSighting(row))
})

export default router
