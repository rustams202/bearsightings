import { useNavigate } from 'react-router-dom'
import SightingForm from '../components/sighting/SightingForm'
import type { SightingFormData } from '../types/sighting'
import { submitSighting } from '../lib/api'

export default function ReportPage() {
  const navigate = useNavigate()

  const handleSubmit = async (data: SightingFormData & { photo?: File }) => {
    const created = await submitSighting(data)
    // Pass the sighting ID to the thank-you page so we can display it
    navigate(`/thank-you?id=${created.id}`)
  }

  return (
    <div className="page-enter mx-auto max-w-xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Report a Bear Sighting</h1>
        <p className="mt-2 text-gray-500 leading-relaxed">
          Thank you for helping us track Vermont's black bears. Your report will be reviewed by our research team.
        </p>
      </div>

      {/* The form card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-6 sm:p-8">
        <SightingForm onSubmit={handleSubmit} />
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Reports are reviewed before appearing publicly. Personal information is kept private.
      </p>
    </div>
  )
}
