import { cn } from '../../lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  hoverable?: boolean
}

export default function Card({ className, children, onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl bg-white border border-gray-100 shadow-card',
        hoverable && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-6 pt-6 pb-4 border-b border-gray-50', className)}>
      {children}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>
}
