import { createContext, useContext, useState } from 'react'

const ReportContext = createContext(null)

export function ReportProvider({ children }) {
  const [uploadId, setUploadId] = useState(null)
  const [targetAcos, setTargetAcos] = useState(null)   // stored as decimal e.g. 0.28
  const [strData, setStrData] = useState(null)
  const [placementData, setPlacementData] = useState(null)
  const [productData, setProductData] = useState(null)

  const hasData = strData !== null && placementData !== null && productData !== null

  return (
    <ReportContext.Provider value={{
      uploadId, setUploadId,
      targetAcos, setTargetAcos,
      strData, setStrData,
      placementData, setPlacementData,
      productData, setProductData,
      hasData,
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
