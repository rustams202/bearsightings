/**
 * BearWatch Vermont — Express API Server
 *
 * In development: runs on port 3001, with Vite (port 5173) proxying /api requests here.
 * In production:  serves the built React app as static files.
 *
 * To add authentication in the future, create middleware in src/middleware/auth.ts
 * and apply it to the admin router.
 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import sightingsRouter from './routes/sightings'
import adminRouter from './routes/admin'
import { UPLOADS_DIR } from './db/database'

const app = express()
const PORT = process.env.PORT ?? 3001

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded photos statically
app.use('/uploads', express.static(UPLOADS_DIR))

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/sightings', sightingsRouter)
app.use('/api/admin', adminRouter)

// ---------------------------------------------------------------------------
// Production: serve the built React frontend
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientBuildPath))
  // All non-API routes return the React app (client-side routing)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'))
  })
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`BearWatch Vermont server running at http://localhost:${PORT}`)
})
