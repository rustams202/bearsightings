import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ClipboardList, BarChart2, ArrowRight } from 'lucide-react'
import Button from '../components/ui/Button'
import { fetchAdminStats } from '../lib/api'
import type { AdminStats } from '../types/sighting'

// ---------------------------------------------------------------------------
// Landing page — public-facing home page
// To update the headline, tagline, or how-it-works steps, edit this file.
// ---------------------------------------------------------------------------

const HOW_IT_WORKS = [
  {
    icon: '🐻',
    title: 'Spot a bear',
    desc: 'See a black bear in Vermont? We want to know about it — backyard, road, trail, anywhere.',
  },
  {
    icon: '📱',
    title: 'Fill out the form',
    desc: 'Takes about 2 minutes. Works on your phone. No account needed.',
  },
  {
    icon: '🔬',
    title: 'Help the research',
    desc: 'Your report becomes part of an anonymized dataset used to study bear populations and behavior.',
  },
]

export default function LandingPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(() => null)
  }, [])

  return (
    <div className="page-enter">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-forest-900 via-forest-700 to-forest-600">
        {/* Decorative background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 35%, #fff 1px, transparent 1px),
                              radial-gradient(circle at 75% 65%, #fff 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-4xl px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 mb-6">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Vermont Wildlife Research Initiative
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Track Black Bears
            <br />
            <span className="text-amber-300">Across Vermont</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            Help researchers understand black bear behavior and movement by reporting what you see.
            Every sighting — big or small — contributes to meaningful science.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/report">
              <Button size="lg" className="bg-white text-forest-800 hover:bg-gray-50 w-full sm:w-auto shadow-lg">
                Report a Sighting
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/map">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 w-full sm:w-auto"
              >
                <MapPin size={18} />
                View the Map
              </Button>
            </Link>
          </div>

          {/* Quick stats */}
          {stats && (
            <div className="mt-14 grid grid-cols-3 gap-4 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center sm:gap-10">
              <StatPill value={stats.total} label="Total sightings" />
              <StatPill value={stats.this_week} label="This week" />
              <StatPill value={stats.top_towns?.[0]?.town ?? 'Vermont'} label="Most active town" isText />
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            Reporting a sighting is quick and easy. Here's all you need to do.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div
              key={i}
              className="relative rounded-2xl bg-white border border-gray-100 shadow-card p-6 text-center"
            >
              <div className="text-4xl mb-4" role="img" aria-hidden="true">{step.icon}</div>
              <div className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-forest-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                {i + 1}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/report">
            <Button size="lg" variant="primary">
              Get started — report a sighting
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Why it matters ───────────────────────────────────────────────── */}
      <section className="bg-forest-50 border-t border-forest-100">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            <FeatureCard
              icon={<ClipboardList size={22} className="text-forest-600" />}
              title="Structured data"
              desc="Every report is stored in a clean database, ready for analysis and export."
            />
            <FeatureCard
              icon={<MapPin size={22} className="text-forest-600" />}
              title="Mapped in real time"
              desc="Sightings appear on an interactive map so you can see patterns across Vermont."
            />
            <FeatureCard
              icon={<BarChart2 size={22} className="text-forest-600" />}
              title="Built for research"
              desc="Data is collected with future analytics, heatmaps, and trend analysis in mind."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function StatPill({
  value,
  label,
  isText = false,
}: {
  value: number | string
  label: string
  isText?: boolean
}) {
  return (
    <div className="text-center">
      <p className={`font-bold text-white ${isText ? 'text-xl' : 'text-3xl'}`}>{value}</p>
      <p className="text-white/60 text-xs mt-0.5">{label}</p>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}
