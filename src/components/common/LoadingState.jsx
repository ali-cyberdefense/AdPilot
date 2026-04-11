// Checkpoint 8
export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-400">
      {message}
    </div>
  )
}
