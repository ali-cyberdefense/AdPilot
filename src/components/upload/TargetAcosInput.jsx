export default function TargetAcosInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-gray-300 font-medium text-sm whitespace-nowrap">
        Target ACOS
      </label>
      <div className="relative">
        <input
          type="number"
          min="1"
          max="100"
          step="0.5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="28"
          className="w-24 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
      </div>
      <p className="text-gray-600 text-xs">
        Used for insight thresholds and bid suggestions
      </p>
    </div>
  )
}
