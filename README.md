# BearWatch Vermont

A web app for reporting and researching black bear sightings across Vermont.

---

## What this app does

- **Public form** — Anyone can report a bear sighting in about 2 minutes, from their phone or computer.
- **Interactive map** — All sightings plotted on a Vermont map with filters for date, town, bear type, and behavior.
- **Research dashboard** — Review reports, mark them as reviewed or flagged, export data to CSV, and see summary stats.
- **Sighting detail pages** — Full report view with a small inline map for any sightings that include GPS coordinates.

---

## How to run it locally

### What you need first

1. **Node.js** (version 18 or newer) — download from [nodejs.org](https://nodejs.org/)
2. A terminal / command prompt

### Step-by-step setup

Open a terminal and run these commands one at a time:

```bash
# 1. Go into the project folder
cd bear-sightings

# 2. Install all dependencies (this takes 1-2 minutes the first time)
npm run setup

# 3. Add sample data so the app has sightings to show immediately
npm run seed

# 4. Start the app
npm run dev
```

Then open your browser to:

- **Public app:** http://localhost:5173
- **Report a sighting:** http://localhost:5173/report
- **Map view:** http://localhost:5173/map
- **Research dashboard:** http://localhost:5173/dashboard

The app will keep running until you close the terminal or press `Ctrl+C`.

### What the commands do

| Command | What it does |
|---|---|
| `npm run setup` | Installs all dependencies (run once) |
| `npm run seed` | Adds 20 sample Vermont bear sightings |
| `npm run dev` | Starts both the backend server and the frontend |
| `npm run build` | Builds a production-ready version |

---

## Where to change things

### App name and branding
- **App name, logo text:** `client/src/components/layout/Header.tsx` (line ~15)
- **Page title (browser tab):** `client/index.html` (line ~15)
- **Footer text:** `client/src/components/layout/Layout.tsx` (last few lines)
- **Primary color (forest green):** `client/tailwind.config.js` — change the `forest` color values
- **Accent color (amber):** `client/tailwind.config.js` — change the `amber` color values
- **Font:** `client/index.html` (Google Fonts link) and `client/tailwind.config.js` (fontFamily)

### Form fields
- **To add or remove form fields:** `client/src/components/sighting/SightingForm.tsx`
  - Update the Zod schema near the top
  - Add the field to the appropriate step (Step 1–4)
  - Update the `SightingFormData` type in `client/src/types/sighting.ts`
  - Add the column to the database schema in `server/src/db/database.ts`

### Map settings
- **Map center and default zoom:** `client/src/components/map/SightingMap.tsx` — `VERMONT_CENTER` and `DEFAULT_ZOOM`
- **Marker colors:** same file, `markerColor()` function
- **Map tile provider:** same file, `<TileLayer url=...>` — replace with any OpenStreetMap-compatible tile URL

### Database
- The database is a single SQLite file at `server/data/sightings.db`
- It's created automatically on first run
- To reset it, delete that file and run `npm run seed` again

---

## Project structure

```
bear-sightings/
├── server/                   # Express API (Node.js + TypeScript)
│   └── src/
│       ├── db/
│       │   ├── database.ts   # SQLite setup + table schema
│       │   └── seed.ts       # Sample data
│       ├── routes/
│       │   ├── sightings.ts  # Public API routes
│       │   └── admin.ts      # Admin/researcher routes
│       └── index.ts          # Server entry point
│
└── client/                   # React frontend (TypeScript + Vite)
    └── src/
        ├── components/
        │   ├── layout/       # Header, page layout wrapper
        │   ├── ui/           # Buttons, badges, cards, spinner
        │   ├── sighting/     # Form, table, filter panel
        │   └── map/          # Interactive Leaflet map
        ├── pages/            # One file per page/view
        ├── types/            # TypeScript type definitions
        └── lib/              # API client, utility functions
```

---

## Next 5 features to build after MVP

1. **Authentication for the dashboard** — Add a simple login so the researcher dashboard isn't publicly accessible. The server already has a `src/middleware/` folder ready for this.

2. **Email notifications** — When a new sighting is submitted, send the researcher a summary email. Useful once submissions start coming in regularly.

3. **Heatmap layer** — Add a Leaflet heatmap overlay to the map page so you can visually see bear density across Vermont by season or year.

4. **Photo moderation / review** — Build a simple image review step in the dashboard so photos can be approved before they appear publicly, and a future AI classification step can be added.

5. **Trend charts** — Add a charts panel to the dashboard showing sightings over time, by month, and by town — useful for spotting seasonal patterns. The data model is already set up to support this.

---

## Tech stack (for technical collaborators)

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Maps | React Leaflet (OpenStreetMap) |
| Backend | Express.js, TypeScript |
| Database | SQLite (via better-sqlite3) |
| File uploads | Multer |

---

*BearWatch Vermont — a wildlife research initiative*
