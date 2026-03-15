import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Clock, Camera, CheckCircle2, Flag, ExternalLink } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import Button from '../components/ui/Button'
import { StatusBadge, BearTypeBadge, LocationTypeBadge, BehaviorBadge } from '../components/ui/Badge'
import { PageSpinner } from '../components/ui/Spinner'
import { fetchAdminSighting, updateSightingStatus } from '../lib/api'
import { formatDate, formatTime, photoUrl, timeAgo } from '../lib/utils'
import type { Sighting } from '../types/sighting'
import { BEHAVIOR_LABELS } from '../types/sighting'

export default function SightingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sighting, setSighting] = useState<Sighting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchAdminSighting(id)
      .then(setSighting)
      .catch(() => setError('Sighting not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async (status: 'reviewed' | 'flagged') => {
    if (!sighting) return
    setSaving(true)
    try {
      const updated = await updateSightingStatus(sighting.id, { status })
      setSighting(updated)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  if (error || !sighting) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-8">
        <span className="text-4xl mb-4">🐻</span>
        <p className="text-gray-700 font-medium mb-2">{error ?? 'Sighting not found'}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Go back
        </Button>
      </div>
    )
  }

  const photo = photoUrl(sighting.photo_filename)

  return (
    <div className="page-enter mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <StatusBadge status={sighting.status} />
            {sighting.is_duplicate && (
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                Possible Duplicate
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Bear Sighting — {sighting.town}, {sighting.state}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {formatDate(sighting.sighting_date)} at {formatTime(sighting.sighting_time)}
            <span className="text-gray-300 mx-2">·</span>
            Reported {timeAgo(sighting.created_at)}
          </p>
        </div>

        {/* Admin actions */}
        <div className="flex gap-2 shrink-0">
          {sighting.status !== 'reviewed' && (
            <Button
              variant="secondary"
              size="sm"
              loading={saving}
              onClick={() => handleStatusUpdate('reviewed')}
            >
              <CheckCircle2 size={14} />
              Mark reviewed
            </Button>
          )}
          {sighting.status !== 'flagged' && (
            <Button
              variant="outline"
              size="sm"
              loading={saving}
              onClick={() => handleStatusUpdate('flagged')}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Flag size={14} />
              Flag
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* Photo */}
        {photo && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-card">
            <img src={photo} alt="Bear sighting" className="w-full max-h-96 object-cover" />
          </div>
        )}

        {/* Key facts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DetailTile icon={<Calendar size={16} />} label="Date" value={formatDate(sighting.sighting_date)} />
          <DetailTile icon={<Clock size={16} />} label="Time" value={formatTime(sighting.sighting_time)} />
          <DetailTile icon={<MapPin size={16} />} label="Town" value={`${sighting.town}, ${sighting.state}`} />
          <DetailTile
            icon={<span className="text-base" role="img" aria-label="bear">🐻</span>}
            label="Count"
            value={`${sighting.bear_count} bear${sighting.bear_count !== 1 ? 's' : ''}`}
          />
        </div>

        {/* Bear details */}
        <SectionCard title="Bear Details">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <Field label="Bear type"><BearTypeBadge type={sighting.bear_type} /></Field>
            <Field label="Location type"><LocationTypeBadge type={sighting.location_type} /></Field>
            {sighting.distance_ft && (
              <Field label="Distance">{sighting.distance_ft} feet away</Field>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Behaviors observed</p>
            <div className="flex flex-wrap gap-1.5">
              {sighting.behaviors.map((b) => (
                <BehaviorBadge key={b} behavior={b} />
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Context */}
        <SectionCard title="Context">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ContextItem
              label="Human food or trash nearby"
              value={sighting.human_food_present}
            />
            <ContextItem
              label="Pets nearby"
              value={sighting.pets_present}
            />
          </div>
        </SectionCard>

        {/* Notes */}
        {sighting.description && (
          <SectionCard title="Observer Notes">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{sighting.description}</p>
          </SectionCard>
        )}

        {/* Location on map */}
        {sighting.latitude && sighting.longitude && (
          <SectionCard title="Location">
            <div className="rounded-xl overflow-hidden border border-gray-100 h-52">
              <MapContainer
                center={[sighting.latitude, sighting.longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <CircleMarker
                  center={[sighting.latitude, sighting.longitude]}
                  radius={10}
                  pathOptions={{ fillColor: '#1a5c38', fillOpacity: 0.9, color: '#fff', weight: 2 }}
                />
              </MapContainer>
            </div>
            <p className="mt-2 text-xs text-gray-400 font-mono">
              {sighting.latitude.toFixed(6)}, {sighting.longitude.toFixed(6)}
            </p>
          </SectionCard>
        )}

        {/* Submitter info */}
        <SectionCard title="Submitted By">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Name">{sighting.submitter_name}</Field>
            {sighting.submitter_email && (
              <Field label="Email">
                <a href={`mailto:${sighting.submitter_email}`} className="text-forest-600 hover:underline flex items-center gap-1">
                  {sighting.submitter_email} <ExternalLink size={12} />
                </a>
              </Field>
            )}
            <Field label="Consent given">{sighting.consent_given ? 'Yes' : 'No'}</Field>
            {sighting.photo_filename && (
              <Field label="Photo"><Camera size={14} className="inline mr-1" />Attached</Field>
            )}
          </div>
        </SectionCard>

        {/* Reviewer notes */}
        {sighting.reviewer_notes && (
          <SectionCard title="Researcher Notes">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{sighting.reviewer_notes}</p>
          </SectionCard>
        )}

        {/* Report metadata */}
        <p className="text-xs text-gray-400 text-center pb-4">
          Report ID: <span className="font-mono">{sighting.id}</span>
          <span className="mx-2">·</span>
          Submitted {timeAgo(sighting.created_at)}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <div className="font-medium text-gray-900">{children}</div>
    </div>
  )
}

function DetailTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-card p-4 text-center">
      <div className="flex justify-center text-gray-400 mb-1.5">{icon}</div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900 text-sm leading-snug">{value}</p>
    </div>
  )
}

function ContextItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-0.5 text-lg ${value ? 'text-amber-500' : 'text-gray-300'}`}>
        {value ? '⚠️' : '✓'}
      </span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`font-medium ${value ? 'text-amber-700' : 'text-gray-500'}`}>
          {value ? 'Yes' : 'No'}
        </p>
      </div>
    </div>
  )
}
