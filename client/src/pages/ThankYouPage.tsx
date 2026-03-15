import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, MapPin, ArrowRight } from 'lucide-react'
import Button from '../components/ui/Button'

export default function ThankYouPage() {
  const [params] = useSearchParams()
  const id = params.get('id')

  return (
    <div className="page-enter flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-forest-100 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-forest-600" />
            </div>
            <span
              className="absolute -top-1 -right-1 text-2xl"
              role="img"
              aria-label="bear"
            >
              🐻
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Report submitted!
        </h1>

        <p className="text-gray-500 leading-relaxed mb-2">
          Thank you for helping us track black bears in Vermont. Your sighting will be reviewed
          by our research team and may appear on the map within 24 hours.
        </p>

        {id && (
          <p className="text-xs text-gray-400 mt-3 font-mono bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            Report ID: {id}
          </p>
        )}

        {/* Actions */}
        <div className="mt-10 space-y-3">
          <Link to="/map" className="block">
            <Button fullWidth size="lg" variant="primary">
              <MapPin size={18} />
              View all sightings on the map
            </Button>
          </Link>

          <Link to="/report" className="block">
            <Button fullWidth size="lg" variant="outline">
              Report another sighting
              <ArrowRight size={16} />
            </Button>
          </Link>

          <Link to="/" className="block">
            <Button fullWidth size="md" variant="ghost" className="text-gray-500">
              Back to home
            </Button>
          </Link>
        </div>

        {/* Tip */}
        <div className="mt-10 rounded-xl bg-amber-50 border border-amber-100 p-4 text-left">
          <p className="text-sm font-semibold text-amber-800 mb-1">Bear safety tip</p>
          <p className="text-sm text-amber-700">
            Never approach or feed a bear. If a bear is in your yard, make noise and give it space
            to leave. Remove bird feeders and secure trash between May and November.
          </p>
        </div>
      </div>
    </div>
  )
}
