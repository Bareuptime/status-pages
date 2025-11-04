'use client'

import { useEffect, useState } from 'react'
import { getPublicStatusPage } from '@/lib/api'
import { StatusPagePublicResponse } from '@/lib/types'
import { StatusPageLayout } from '@/components/status-page/status-page-layout'
import { StatusPageLoading, StatusPageError } from '@/components/status-page/status-page-states'

export default function StatusPage() {
  const [statusPage, setStatusPage] = useState<StatusPagePublicResponse | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Extract key from subdomain
  const getKey = (): string => {
    if (typeof window === 'undefined') {
      console.log('Window is undefined, returning default key "status"')
      return 'status' // Default for SSR
    }

    const hostname = window.location.hostname

    // For localhost development, use 'status' as default
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      console.log('returning default key "status"')
      return 'status'
    }

    // Extract subdomain (e.g., "example" from "example.bareuptime.online")
    const parts = hostname.split('.')

    // If we have at least 3 parts (subdomain.domain.tld)
    if (parts.length >= 3) {
      return parts[0]
    }

    // Fallback to 'status' for any other case
    return 'status'
  }

  const fetchStatusPage = async () => {
    try {
      setLoading(true)
      setError(null)
      const key = getKey()
      console.log('Fetching status page for key:', key)
      const data = await getPublicStatusPage(key)
      setStatusPage(data)
      setLastRefresh(new Date())
    } catch (err: any) {
      console.error('Failed to fetch status page:', err)
      setError(err.message || 'Failed to load status page')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchStatusPage()
  }, [])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatusPage()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <StatusPageLoading />
  }

  if (error || !statusPage) {
    return <StatusPageError error={error || 'Status page not found'} onRetry={fetchStatusPage} />
  }

  return (
    <StatusPageLayout
      statusPage={statusPage}
      lastRefresh={lastRefresh}
      onRefresh={fetchStatusPage}
    />
  )
}
