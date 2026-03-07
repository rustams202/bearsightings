// ---------------------------------------------------------------------------
// Core domain types
// These types are shared across the entire application.
// When adding new species, extend LocationType and add a species field.
// ---------------------------------------------------------------------------

export type LocationType =
  | 'backyard'
  | 'road'
  | 'forest'
  | 'trail'
  | 'farm'
  | 'neighborhood'
  | 'campsite'
  | 'other'

export type BearType = 'adult' | 'cub' | 'mother_with_cubs' | 'unknown'

export type BearBehavior =
  | 'crossing_road'
  | 'eating'
  | 'near_trash'
  | 'climbing_tree'
  | 'resting'
  | 'aggressive'
  | 'calm'
  | 'unknown'

export type SightingStatus = 'pending' | 'reviewed' | 'flagged'

// Full sighting record as returned from the API
export interface Sighting {
  id: string
  sighting_date: string
  sighting_time: string
  town: string
  state: string
  latitude: number | null
  longitude: number | null
  location_type: LocationType
  species: string
  bear_count: number
  bear_type: BearType
  behaviors: BearBehavior[]
  distance_ft: number | null
  human_food_present: boolean
  pets_present: boolean
  description: string | null
  submitter_name: string
  submitter_email: string | null
  consent_given: boolean
  photo_filename: string | null
  status: SightingStatus
  reviewed_at: string | null
  reviewer_notes: string | null
  is_duplicate: boolean
  duplicate_of: string | null
  created_at: string
  updated_at: string
}

// Data shape of the public submission form
export interface SightingFormData {
  sighting_date: string
  sighting_time: string
  town: string
  state: string
  latitude?: number
  longitude?: number
  location_type: LocationType
  bear_count: number
  bear_type: BearType
  behaviors: BearBehavior[]
  distance_ft?: number
  human_food_present: boolean
  pets_present: boolean
  description?: string
  submitter_name: string
  submitter_email?: string
  consent_given: boolean
  photo?: File
}

// Filters used by the map, list, and dashboard
export interface SightingFilters {
  search?: string
  town?: string
  date_from?: string
  date_to?: string
  bear_type?: BearType | ''
  behavior?: BearBehavior | ''
  status?: SightingStatus | ''
  location_type?: LocationType | ''
}

// Summary stats for the admin dashboard
export interface AdminStats {
  total: number
  this_week: number
  pending: number
  top_towns: Array<{ town: string; count: number }>
  top_behaviors: Array<{ behavior: string; count: number }>
  recent: Sighting[]
}

// ---------------------------------------------------------------------------
// Display label maps — update these when adding options
// ---------------------------------------------------------------------------

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  backyard: 'Backyard',
  road: 'Road',
  forest: 'Forest',
  trail: 'Trail',
  farm: 'Farm',
  neighborhood: 'Neighborhood',
  campsite: 'Campsite',
  other: 'Other',
}

export const BEAR_TYPE_LABELS: Record<BearType, string> = {
  adult: 'Adult',
  cub: 'Cub',
  mother_with_cubs: 'Mother with Cubs',
  unknown: 'Unknown',
}

export const BEHAVIOR_LABELS: Record<BearBehavior, string> = {
  crossing_road: 'Crossing Road',
  eating: 'Eating / Foraging',
  near_trash: 'Near Trash / Food',
  climbing_tree: 'Climbing Tree',
  resting: 'Resting',
  aggressive: 'Aggressive',
  calm: 'Calm',
  unknown: 'Unknown',
}
