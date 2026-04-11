// Checkpoint 8
export default function EmptyState({ message = 'No data yet.' }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-400">
      {message}
    </div>
  )
}
