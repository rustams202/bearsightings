import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import ReportPage from './pages/ReportPage'
import ThankYouPage from './pages/ThankYouPage'
import MapPage from './pages/MapPage'
import DashboardPage from './pages/DashboardPage'
import SightingDetailPage from './pages/SightingDetailPage'

/**
 * Main routing configuration.
 * To add a new page: add a Route here and create a new file in src/pages/.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sighting/:id" element={<SightingDetailPage />} />
      </Route>
    </Routes>
  )
}
