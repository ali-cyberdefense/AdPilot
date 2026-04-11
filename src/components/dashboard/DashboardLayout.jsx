import Navbar from '../common/Navbar'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg font-medium">Dashboard</p>
          <p className="text-gray-600 text-sm mt-1">Checkpoint 3 — Upload reports to continue</p>
        </div>
      </main>
    </div>
  )
}
