import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useReportContext } from '../../context/ReportContext'

export default function Navbar({ chatOpen, onChatToggle }) {
  const { user } = useAuth()
  const { hasData, setStrData, setPlacementData, setProductData, setInsights, setSummary, setUploadId, setTargetAcos } = useReportContext()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleNewReport = () => {
    setUploadId(null)
    setTargetAcos(null)
    setStrData(null)
    setPlacementData(null)
    setProductData(null)
    setInsights([])
    setSummary(null)
  }

  return (
    <nav className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-white font-bold tracking-tight">AdPilot</span>
        <span className="text-gray-600 text-xs">v0.1</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-500 text-sm hidden sm:block">{user?.email}</span>
        {hasData && (
          <button
            onClick={handleNewReport}
            className="text-gray-400 hover:text-indigo-400 text-sm transition-colors"
          >
            New report
          </button>
        )}
        {hasData && (
          <button
            onClick={onChatToggle}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              chatOpen
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Ask AI
          </button>
        )}
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
