import { supabase } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const { user } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-white font-bold tracking-tight">AdPilot</span>
        <span className="text-gray-600 text-xs">v0.1</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-500 text-sm hidden sm:block">{user?.email}</span>
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
