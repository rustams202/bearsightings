import { cn } from '../../lib/utils'
import {
  BEHAVIOR_LABELS,
  BEAR_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
  type BearBehavior,
  type BearType,
  type LocationType,
  type SightingStatus,
} from '../../types/sighting'
import { behaviorColor, bearTypeColor, locationTypeColor, statusColor } from '../../lib/utils'

interface BadgeProps {
  className?: string
  children: React.ReactNode
  colorClass?: string
}

function Badge({ children, colorClass = 'bg-gray-100 text-gray-600 border-gray-200', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: SightingStatus }) {
  const labels: Record<SightingStatus, string> = {
    pending:  'Pending',
    reviewed: 'Reviewed',
    flagged:  'Flagged',
  }
  return <Badge colorClass={statusColor(status)}>{labels[status]}</Badge>
}

export function BearTypeBadge({ type }: { type: BearType }) {
  return <Badge colorClass={bearTypeColor(type)}>{BEAR_TYPE_LABELS[type]}</Badge>
}

export function LocationTypeBadge({ type }: { type: LocationType }) {
  return <Badge colorClass={locationTypeColor(type)}>{LOCATION_TYPE_LABELS[type]}</Badge>
}

export function BehaviorBadge({ behavior }: { behavior: BearBehavior }) {
  return <Badge colorClass={behaviorColor(behavior)}>{BEHAVIOR_LABELS[behavior]}</Badge>
}

export default Badge
