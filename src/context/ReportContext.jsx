import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { buildStructuredSummary } from '../services/insightEngine'

const ReportContext = createContext(null)

// Paginates through all rows for a given table + upload_id
async function fetchAll(table, uploadId) {
  const PAGE = 1000
  let all = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('upload_id', uploadId)
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`Failed loading ${table}: ${error.message}`)
    if (!data?.length) break
    all = [...all, ...data]
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

export function ReportProvider({ children }) {
  const [uploadId, setUploadId]         = useState(null)
  const [targetAcos, setTargetAcos]     = useState(null)
  const [strData, setStrData]           = useState(null)
  const [placementData, setPlacementData] = useState(null)
  const [productData, setProductData]   = useState(null)
  const [insights, setInsights]         = useState([])
  const [summary, setSummary]           = useState(null)
  const [loading, setLoading]           = useState(true) // true while checking for saved data

  // On mount: try to restore the most recent upload from Supabase
  useEffect(() => {
    async function tryRestore() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { setLoading(false); return }

        // Fetch most recent upload for this user
        const { data: uploads } = await supabase
          .from('uploads')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (!uploads?.length) { setLoading(false); return }

        const upload = uploads[0]

        // Fetch all data rows (paginated)
        const [str, placement, product, savedInsights] = await Promise.all([
          fetchAll('str_data',        upload.id),
          fetchAll('placement_data',  upload.id),
          fetchAll('product_data',    upload.id),
          fetchAll('insights',        upload.id),
        ])

        const targetAcosVal = upload.target_acos
        const structuredSummary = buildStructuredSummary(str, placement, product, savedInsights, targetAcosVal)

        setUploadId(upload.id)
        setTargetAcos(targetAcosVal)
        setStrData(str)
        setPlacementData(placement)
        setProductData(product)
        setInsights(savedInsights)
        setSummary(structuredSummary)
      } catch (e) {
        console.warn('Could not restore previous upload:', e.message)
      } finally {
        setLoading(false)
      }
    }

    tryRestore()
  }, [])

  const hasData = strData !== null && placementData !== null && productData !== null

  return (
    <ReportContext.Provider value={{
      uploadId, setUploadId,
      targetAcos, setTargetAcos,
      strData, setStrData,
      placementData, setPlacementData,
      productData, setProductData,
      insights, setInsights,
      summary, setSummary,
      hasData,
      loading,
    }}>
      {children}
    </ReportContext.Provider>
  )
}

export const useReportContext = () => {
  const ctx = useContext(ReportContext)
  if (!ctx) throw new Error('useReportContext must be used inside ReportProvider')
  return ctx
}
