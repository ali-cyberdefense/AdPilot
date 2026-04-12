import { useRef, useState } from 'react'

const REPORT_SLOTS = [
  {
    key: 'str',
    label: 'Search Term Report',
    description: 'SP Search Term Report',
    hint: '~1,400 rows · 26 columns',
  },
  {
    key: 'placement',
    label: 'Placement Report',
    description: 'SP Placement Report',
    hint: '~265 rows · 18 columns',
  },
  {
    key: 'product',
    label: 'Advertised Products Report',
    description: 'SP Advertised Products Report',
    hint: '~700 rows · 25 columns',
  },
]

function DropZone({ slot, file, onFile, error }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(slot.key, f)
  }

  const handleChange = (e) => {
    const f = e.target.files[0]
    if (f) onFile(slot.key, f)
  }

  let borderColor = 'border-gray-700 hover:border-gray-500'
  if (dragging) borderColor = 'border-indigo-500 bg-indigo-950/30'
  else if (error) borderColor = 'border-red-800 bg-red-950/20'
  else if (file) borderColor = 'border-green-700 bg-green-950/20'

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${borderColor}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv,.tsv"
        className="hidden"
        onChange={handleChange}
      />

      {/* Icon */}
      <div className="mb-3">
        {file ? (
          <div className="w-10 h-10 mx-auto bg-green-900/50 rounded-full flex items-center justify-center">
            <CheckIcon />
          </div>
        ) : (
          <div className="w-10 h-10 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
            <UploadIcon />
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-white font-medium text-sm mb-0.5">{slot.label}</p>
      <p className="text-gray-500 text-xs mb-3">{slot.hint}</p>

      {/* File state */}
      {file ? (
        <p className="text-green-400 text-xs font-mono truncate max-w-full">{file.name}</p>
      ) : error ? (
        <p className="text-red-400 text-xs">{error}</p>
      ) : (
        <p className="text-gray-600 text-xs">Drop .xlsx or .csv here, or click to browse</p>
      )}
    </div>
  )
}

export default function ReportUploader({ files, onFile, errors }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {REPORT_SLOTS.map((slot) => (
        <DropZone
          key={slot.key}
          slot={slot}
          file={files[slot.key]}
          onFile={onFile}
          error={errors?.[slot.key]}
        />
      ))}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
