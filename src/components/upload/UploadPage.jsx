import { useState } from 'react'
import { supabase } from '../../services/supabase'
import {
  parseSearchTermReport,
  parsePlacementReport,
  parseAdvertisedProductsReport,
} from '../../services/reportParser'
import { generateInsights, buildStructuredSummary } from '../../services/insightEngine'
import { useReportContext } from '../../context/ReportContext'
import { useAuth } from '../../hooks/useAuth'
import ReportUploader from './ReportUploader'
import TargetAcosInput from './TargetAcosInput'

const CHUNK = 400 // rows per Supabase insert batch

async function bulkInsert(table, rows, uploadId) {
  const tagged = rows.map((r) => ({ ...r, upload_id: uploadId }))
  for (let i = 0; i < tagged.length; i += CHUNK) {
    const { error } = await supabase.from(table).insert(tagged.slice(i, i + CHUNK))
    if (error) throw new Error(`Failed saving to ${table}: ${error.message}`)
  }
}

export default function UploadPage() {
  const { user } = useAuth()
  const { setUploadId, setTargetAcos, setStrData, setPlacementData, setProductData, setInsights, setSummary } = useReportContext()

  const [files, setFiles] = useState({ str: null, placement: null, product: null })
  const [targetAcosInput, setTargetAcosInput] = useState('')
  const [parseErrors, setParseErrors] = useState({})
  const [status, setStatus] = useState(null) // null | 'parsing' | 'saving' | 'done' | 'error'
  const [statusMsg, setStatusMsg] = useState('')
  const [preview, setPreview] = useState(null)

  const handleFile = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file }))
    setParseErrors((prev) => ({ ...prev, [key]: null }))
    setPreview(null)
    setStatus(null)
  }

  const allFilesSelected = files.str && files.placement && files.product
  const targetAcosValid = targetAcosInput !== '' && Number(targetAcosInput) > 0

  const handleProcess = async () => {
    if (!allFilesSelected || !targetAcosValid) return

    setStatus('parsing')
    setStatusMsg('Parsing files...')
    setParseErrors({})

    let str, placement, product
    const errors = {}

    try {
      setStatusMsg('Parsing Search Term Report...')
      str = await parseSearchTermReport(files.str)
    } catch (e) {
      errors.str = e.message
    }

    try {
      setStatusMsg('Parsing Placement Report...')
      placement = await parsePlacementReport(files.placement)
    } catch (e) {
      errors.placement = e.message
    }

    try {
      setStatusMsg('Parsing Advertised Products Report...')
      product = await parseAdvertisedProductsReport(files.product)
    } catch (e) {
      errors.product = e.message
    }

    if (Object.keys(errors).length > 0) {
      setParseErrors(errors)
      setStatus('error')
      setStatusMsg('Fix the errors above and try again.')
      return
    }

    const targetAcosDecimal = Number(targetAcosInput) / 100

    setPreview({
      strRows: str.length,
      placementRows: placement.length,
      productRows: product.length,
      totalSpend: str.reduce((s, r) => s + (r.spend || 0), 0),
      totalSales: str.reduce((s, r) => s + (r.sales || 0), 0),
      totalOrders: str.reduce((s, r) => s + (r.orders || 0), 0),
    })

    setStatus('saving')
    setStatusMsg('Saving to Supabase...')

    try {
      // 1. Upsert user + target ACOS
      await supabase.from('users').upsert(
        { id: user.id, email: user.email, target_acos: targetAcosDecimal },
        { onConflict: 'id' }
      )

      // 2. Create upload session
      const { data: upload, error: uploadErr } = await supabase
        .from('uploads')
        .insert({
          user_id: user.id,
          target_acos: targetAcosDecimal,
          str_rows: str.length,
          placement_rows: placement.length,
          product_rows: product.length,
        })
        .select()
        .single()

      if (uploadErr) throw new Error(`Upload session failed: ${uploadErr.message}`)

      const uploadId = upload.id

      // 3. Bulk insert all report data
      setStatusMsg(`Saving ${str.length} search terms...`)
      await bulkInsert('str_data', str, uploadId)

      setStatusMsg(`Saving ${placement.length} placements...`)
      await bulkInsert('placement_data', placement, uploadId)

      setStatusMsg(`Saving ${product.length} products...`)
      await bulkInsert('product_data', product, uploadId)

      // 4. Run insight engine
      setStatusMsg('Running insight engine...')
      const generatedInsights = generateInsights(str, placement, product, targetAcosDecimal)
      const structuredSummary = buildStructuredSummary(str, placement, product, generatedInsights, targetAcosDecimal)

      // 5. Store insights in Supabase
      if (generatedInsights.length > 0) {
        const { error: insightErr } = await supabase.from('insights').insert(
          generatedInsights.map(i => ({ ...i, upload_id: uploadId }))
        )
        if (insightErr) console.warn('Insight storage failed:', insightErr.message)
      }

      // 6. Update React context → triggers dashboard render
      setUploadId(uploadId)
      setTargetAcos(targetAcosDecimal)
      setStrData(str)
      setPlacementData(placement)
      setProductData(product)
      setInsights(generatedInsights)
      setSummary(structuredSummary)

      setStatus('done')
      setStatusMsg(`Done — ${generatedInsights.length} insights generated.`)
    } catch (e) {
      setStatus('error')
      setStatusMsg(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-white text-2xl font-bold mb-1">Upload SP Reports</h2>
          <p className="text-gray-500 text-sm">
            Upload your three Sponsored Products reports to generate insights.
          </p>
        </div>

        {/* Target ACOS */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <TargetAcosInput value={targetAcosInput} onChange={setTargetAcosInput} />
        </div>

        {/* Drop zones */}
        <div className="mb-6">
          <ReportUploader files={files} onFile={handleFile} errors={parseErrors} />
        </div>

        {/* Preview (after parsing) */}
        {preview && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 grid grid-cols-3 gap-4 text-center">
            <Stat label="Search Terms" value={preview.strRows.toLocaleString()} />
            <Stat label="Placement Rows" value={preview.placementRows.toLocaleString()} />
            <Stat label="Product Rows" value={preview.productRows.toLocaleString()} />
            <Stat label="Total Spend" value={`$${preview.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <Stat label="Total Sales" value={`$${preview.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <Stat label="Total Orders" value={preview.totalOrders.toLocaleString()} />
          </div>
        )}

        {/* Status message */}
        {statusMsg && (
          <p className={`text-sm mb-4 ${status === 'error' ? 'text-red-400' : status === 'done' ? 'text-green-400' : 'text-gray-400'}`}>
            {status !== 'done' && status !== 'error' && (
              <span className="inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-2 align-middle" />
            )}
            {statusMsg}
          </p>
        )}

        {/* Process button */}
        <button
          onClick={handleProcess}
          disabled={!allFilesSelected || !targetAcosValid || status === 'parsing' || status === 'saving' || status === 'done'}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {status === 'parsing' || status === 'saving'
            ? 'Processing...'
            : status === 'done'
            ? 'Reports Loaded — View Dashboard'
            : 'Process Reports'}
        </button>

        {!allFilesSelected && (
          <p className="text-center text-gray-600 text-xs mt-3">
            Add all 3 report files and set your Target ACOS to continue
          </p>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white font-mono font-semibold">{value}</p>
    </div>
  )
}
