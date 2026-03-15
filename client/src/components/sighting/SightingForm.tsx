/**
 * Multi-step bear sighting submission form.
 *
 * Steps:
 *   1. When & Where  — date, time, town, location type, GPS
 *   2. The Bear      — count, type, behaviors, distance
 *   3. Context       — food/pets present, photo, notes
 *   4. About You     — name, email, consent
 *
 * To add or remove fields:
 *   1. Update the Zod schema (sightingSchema)
 *   2. Update the step component that renders that field
 *   3. Update STEP_FIELDS so validation triggers on the right step
 *   4. Update the SightingFormData type in src/types/sighting.ts
 */

import { useState, useCallback } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDropzone } from 'react-dropzone'
import { MapPin, Upload, X, CheckCircle2, ChevronRight, ChevronLeft, Locate } from 'lucide-react'
import type { SightingFormData, BearBehavior } from '../../types/sighting'
import { BEHAVIOR_LABELS } from '../../types/sighting'
import Button from '../ui/Button'
import { cn, todayString, nowTimeString } from '../../lib/utils'

// ---------------------------------------------------------------------------
// Zod validation schema
// ---------------------------------------------------------------------------
const sightingSchema = z.object({
  sighting_date:       z.string().min(1, 'Date is required'),
  sighting_time:       z.string().min(1, 'Time is required'),
  town:                z.string().min(1, 'Town or city is required').max(100),
  state:               z.string().default('Vermont'),
  latitude:            z.number().optional(),
  longitude:           z.number().optional(),
  location_type:       z.enum(['backyard', 'road', 'forest', 'trail', 'farm', 'neighborhood', 'campsite', 'other'], {
    required_error: 'Please select a location type',
  }),
  bear_count:          z.number().int().min(1, 'At least 1 bear').max(20),
  bear_type:           z.enum(['adult', 'cub', 'mother_with_cubs', 'unknown']),
  behaviors:           z.array(z.string()).min(1, 'Select at least one behavior'),
  distance_ft:         z.number().int().min(1).max(5000).optional(),
  human_food_present:  z.boolean(),
  pets_present:        z.boolean(),
  description:         z.string().max(2000).optional(),
  submitter_name:      z.string().min(1, 'Your name is required').max(200),
  submitter_email:     z.union([z.string().email('Enter a valid email'), z.literal('')]).optional(),
  consent_given:       z.boolean().refine((v) => v === true, {
    message: 'Please agree to research use of your report',
  }),
})

type FormValues = z.infer<typeof sightingSchema>

// Which form fields belong to each step (for per-step validation)
const STEP_FIELDS: Array<Array<FieldPath<FormValues>>> = [
  ['sighting_date', 'sighting_time', 'town', 'state', 'location_type'],
  ['bear_count', 'bear_type', 'behaviors'],
  [],
  ['submitter_name', 'consent_given'],
]

const STEP_TITLES = ['When & Where', 'The Bear', 'Context', 'About You']
const STEP_DESCRIPTIONS = [
  'Tell us when and where you saw the bear.',
  'Describe what you observed.',
  'Any additional context helps researchers.',
  'Your name lets us follow up if needed.',
]

const LOCATION_TYPES = [
  { value: 'backyard',      label: 'Backyard',      emoji: '🏡' },
  { value: 'road',          label: 'Road',           emoji: '🛣️' },
  { value: 'forest',        label: 'Forest',         emoji: '🌲' },
  { value: 'trail',         label: 'Trail',          emoji: '🥾' },
  { value: 'farm',          label: 'Farm',           emoji: '🌾' },
  { value: 'neighborhood',  label: 'Neighborhood',   emoji: '🏘️' },
  { value: 'campsite',      label: 'Campsite',       emoji: '⛺' },
  { value: 'other',         label: 'Other',          emoji: '📍' },
]

const BEAR_TYPES = [
  { value: 'adult',           label: 'Adult',            desc: 'A single grown bear' },
  { value: 'cub',             label: 'Cub',              desc: 'A young bear alone' },
  { value: 'mother_with_cubs',label: 'Mother with cubs', desc: 'A female with young' },
  { value: 'unknown',         label: 'Not sure',         desc: 'Could not tell' },
]

const BEHAVIORS: BearBehavior[] = [
  'crossing_road', 'eating', 'near_trash', 'climbing_tree', 'resting', 'aggressive', 'calm', 'unknown',
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface SightingFormProps {
  onSubmit: (data: SightingFormData & { photo?: File }) => Promise<void>
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function SightingForm({ onSubmit }: SightingFormProps) {
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(sightingSchema),
    defaultValues: {
      sighting_date: todayString(),
      sighting_time: nowTimeString(),
      state: 'Vermont',
      bear_count: 1,
      bear_type: 'unknown',
      behaviors: [],
      human_food_present: false,
      pets_present: false,
      consent_given: false,
    },
  })

  const watchedBehaviors = watch('behaviors') as string[]
  const watchedLat = watch('latitude')
  const watchedLng = watch('longitude')

  // ── Step navigation ─────────────────────────────────────────────────────

  const handleNext = async () => {
    const fields = STEP_FIELDS[step]
    const valid = fields.length === 0 ? true : await trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  // ── GPS detection ────────────────────────────────────────────────────────

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', parseFloat(pos.coords.latitude.toFixed(6)))
        setValue('longitude', parseFloat(pos.coords.longitude.toFixed(6)))
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000 }
    )
  }

  // ── Photo dropzone ───────────────────────────────────────────────────────

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return
    const file = accepted[0]
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const removePhoto = () => {
    setPhoto(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
  }

  // ── Form submission ──────────────────────────────────────────────────────

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      await onSubmit({
        ...values,
        distance_ft: values.distance_ft ?? undefined,
        description: values.description ?? undefined,
        submitter_email: values.submitter_email ?? undefined,
        behaviors: values.behaviors as BearBehavior[],
        photo: photo ?? undefined,
      })
    } finally {
      setSubmitting(false)
    }
  })

  // ── Behavior toggle ──────────────────────────────────────────────────────

  const toggleBehavior = (b: string) => {
    const current = getValues('behaviors') as string[]
    if (current.includes(b)) {
      setValue('behaviors', current.filter((x) => x !== b), { shouldValidate: true })
    } else {
      setValue('behaviors', [...current, b], { shouldValidate: true })
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8">
      {/* Progress indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-900">{STEP_TITLES[step]}</span>
          <span className="text-gray-400">Step {step + 1} of {STEP_TITLES.length}</span>
        </div>
        <div className="flex gap-1.5">
          {STEP_TITLES.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i <= step ? 'bg-forest-500' : 'bg-gray-200'
              )}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500">{STEP_DESCRIPTIONS[step]}</p>
      </div>

      {/* ── Step 1: When & Where ────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Date of sighting</label>
              <input
                type="date"
                className="field-input"
                {...register('sighting_date')}
              />
              {errors.sighting_date && <p className="field-error">{errors.sighting_date.message}</p>}
            </div>
            <div>
              <label className="field-label">Time of sighting</label>
              <input
                type="time"
                className="field-input"
                {...register('sighting_time')}
              />
              {errors.sighting_time && <p className="field-error">{errors.sighting_time.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label">Town or city</label>
              <input
                type="text"
                placeholder="e.g. Burlington"
                className="field-input"
                {...register('town')}
              />
              {errors.town && <p className="field-error">{errors.town.message}</p>}
            </div>
            <div>
              <label className="field-label">State</label>
              <input
                type="text"
                className="field-input"
                {...register('state')}
              />
            </div>
          </div>

          {/* GPS coordinates */}
          <div>
            <label className="field-label">GPS Coordinates <span className="text-gray-400 font-normal">(optional — very helpful)</span></label>
            <div className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Latitude"
                  step="0.000001"
                  className="field-input text-sm"
                  {...register('latitude', { valueAsNumber: true })}
                />
                <input
                  type="number"
                  placeholder="Longitude"
                  step="0.000001"
                  className="field-input text-sm"
                  {...register('longitude', { valueAsNumber: true })}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="md"
                loading={locating}
                onClick={detectLocation}
                className="shrink-0"
                title="Detect my location"
              >
                <Locate size={16} />
                {!locating && <span className="hidden sm:inline">Detect</span>}
              </Button>
            </div>
            {(watchedLat || watchedLng) && (
              <p className="field-hint flex items-center gap-1 text-forest-600">
                <MapPin size={12} />
                {watchedLat?.toFixed(5)}, {watchedLng?.toFixed(5)}
              </p>
            )}
          </div>

          {/* Location type */}
          <div>
            <label className="field-label">Type of location</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LOCATION_TYPES.map((lt) => {
                const current = watch('location_type')
                return (
                  <label
                    key={lt.value}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border-2 p-3 cursor-pointer transition-all text-center text-sm font-medium',
                      current === lt.value
                        ? 'border-forest-500 bg-forest-50 text-forest-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <input type="radio" value={lt.value} className="sr-only" {...register('location_type')} />
                    <span className="text-2xl" role="img" aria-hidden="true">{lt.emoji}</span>
                    {lt.label}
                  </label>
                )
              })}
            </div>
            {errors.location_type && <p className="field-error mt-1">{errors.location_type.message}</p>}
          </div>
        </div>
      )}

      {/* ── Step 2: The Bear ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Bear count */}
          <div>
            <label className="field-label">How many bears did you see?</label>
            <input
              type="number"
              min="1"
              max="20"
              className="field-input w-28"
              {...register('bear_count', { valueAsNumber: true })}
            />
            {errors.bear_count && <p className="field-error">{errors.bear_count.message}</p>}
          </div>

          {/* Bear type */}
          <div>
            <label className="field-label">What type of bear?</label>
            <div className="grid grid-cols-2 gap-2">
              {BEAR_TYPES.map((bt) => {
                const current = watch('bear_type')
                return (
                  <label
                    key={bt.value}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all',
                      current === bt.value
                        ? 'border-forest-500 bg-forest-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <input type="radio" value={bt.value} className="sr-only" {...register('bear_type')} />
                    <div className={cn(
                      'h-4 w-4 rounded-full border-2 shrink-0 transition-all flex items-center justify-center',
                      current === bt.value ? 'border-forest-500 bg-forest-500' : 'border-gray-300'
                    )}>
                      {current === bt.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{bt.label}</p>
                      <p className="text-xs text-gray-400">{bt.desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Behaviors */}
          <div>
            <label className="field-label">What was the bear doing? <span className="text-gray-400 font-normal">(select all that apply)</span></label>
            <div className="flex flex-wrap gap-2">
              {BEHAVIORS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBehavior(b)}
                  className={cn(
                    'rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all',
                    watchedBehaviors.includes(b)
                      ? 'border-forest-500 bg-forest-500 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  {BEHAVIOR_LABELS[b]}
                </button>
              ))}
            </div>
            {errors.behaviors && <p className="field-error">{(errors.behaviors as { message?: string }).message}</p>}
          </div>

          {/* Distance */}
          <div>
            <label className="field-label">Approximate distance from you <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="e.g. 50"
                min="1"
                max="5000"
                className="field-input w-32"
                {...register('distance_ft', { valueAsNumber: true })}
              />
              <span className="text-sm text-gray-500">feet</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Context ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Yes/No questions */}
          <div className="space-y-3">
            <YesNoField
              label="Was there human food, trash, or bird feeders nearby?"
              checked={watch('human_food_present')}
              onChange={(v) => setValue('human_food_present', v)}
            />
            <YesNoField
              label="Were there pets nearby?"
              checked={watch('pets_present')}
              onChange={(v) => setValue('pets_present', v)}
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="field-label">Photo <span className="text-gray-400 font-normal">(optional — drag & drop or click)</span></label>
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-forest-200">
                <img src={photoPreview} alt="Sighting" className="w-full max-h-64 object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  'rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all',
                  isDragActive
                    ? 'border-forest-400 bg-forest-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                )}
              >
                <input {...getInputProps()} />
                <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive ? 'Drop it here' : 'Upload a photo'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, HEIC up to 10 MB</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="field-label">Notes or description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              rows={4}
              placeholder="Anything else that might be helpful — what the bear looked like, what happened before or after, how long it stayed…"
              className="field-input resize-none"
              {...register('description')}
            />
            <p className="field-hint">Up to 2,000 characters.</p>
          </div>
        </div>
      )}

      {/* ── Step 4: About You ────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label className="field-label">Your name</label>
            <input
              type="text"
              placeholder="First and last name"
              className="field-input"
              {...register('submitter_name')}
            />
            {errors.submitter_name && <p className="field-error">{errors.submitter_name.message}</p>}
          </div>

          <div>
            <label className="field-label">Email address <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="email"
              placeholder="you@example.com"
              className="field-input"
              {...register('submitter_email')}
            />
            {errors.submitter_email && <p className="field-error">{errors.submitter_email.message}</p>}
            <p className="field-hint">Only used if researchers need to follow up. Never shared publicly.</p>
          </div>

          {/* Consent */}
          <label className={cn(
            'flex gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all',
            watch('consent_given') ? 'border-forest-400 bg-forest-50' : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-forest-600 focus:ring-forest-500 shrink-0"
              {...register('consent_given')}
            />
            <div>
              <p className="font-medium text-sm text-gray-900">I agree to research use</p>
              <p className="text-sm text-gray-500 mt-0.5">
                I consent to my anonymized sighting data being used for wildlife research. My personal information will not be shared.
              </p>
            </div>
          </label>
          {errors.consent_given && <p className="field-error">{errors.consent_given.message}</p>}
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {step > 0 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ChevronLeft size={16} />
              Back
            </Button>
          )}
        </div>

        {step < STEP_TITLES.length - 1 ? (
          <Button type="button" variant="primary" size="lg" onClick={handleNext}>
            Continue
            <ChevronRight size={18} />
          </Button>
        ) : (
          <Button type="submit" variant="primary" size="lg" loading={submitting} fullWidth={false}>
            <CheckCircle2 size={18} />
            Submit report
          </Button>
        )}
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Yes/No toggle field
// ---------------------------------------------------------------------------
function YesNoField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4">
      <span className="text-sm font-medium text-gray-700 leading-snug">{label}</span>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all',
            checked ? 'border-forest-500 bg-forest-500 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all',
            !checked ? 'border-forest-500 bg-forest-500 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'
          )}
        >
          No
        </button>
      </div>
    </div>
  )
}
