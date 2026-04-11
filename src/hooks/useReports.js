// AdPilot — Report data state hook
// Checkpoint 3 will implement full logic — stub for now.

import { useState } from 'react'

export const useReports = () => {
  const [strData, setStrData] = useState(null)
  const [placementData, setPlacementData] = useState(null)
  const [productData, setProductData] = useState(null)
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return {
    strData, setStrData,
    placementData, setPlacementData,
    productData, setProductData,
    insights, setInsights,
    loading, setLoading,
    error, setError,
  }
}
