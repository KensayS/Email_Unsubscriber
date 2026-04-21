'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { UnsubscribedRecord } from '@/types'

export function UnsubscribedView() {
  const [records, setRecords] = useState<UnsubscribedRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUnsubscribes() {
      try {
        console.log('[UnsubscribedView] Fetching unsubscribed records...')
        const response = await fetch('/api/unsubscribes')

        if (!response.ok) {
          throw new Error(`Failed to fetch unsubscribes: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('[UnsubscribedView] Fetched records:', data)
        setRecords(data)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error('[UnsubscribedView] Error fetching unsubscribes:', errorMessage)
        setError(errorMessage)
        setRecords([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnsubscribes()
  }, [])

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-5 h-5 border-2 border-[#e5e5e5] dark:border-[#525252] border-t-[#1a1a1a] dark:border-t-[#e5e5e5] rounded-full animate-spin" />
        <div className="text-sm text-[#737373] dark:text-[#a3a3a3]">Loading unsubscribed senders…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-lg border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-[#f5f5f5] dark:bg-[#2d2d2d] p-4">
        <div className="text-sm text-[#1a1a1a] dark:text-[#e5e5e5]">Error loading unsubscribes: {error}</div>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-sm text-[#737373] dark:text-[#a3a3a3]">✓ All clean! No unsubscribes yet</div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#1a1a1a] overflow-hidden shadow-sm dark:shadow-sm transition-all duration-300">
      <div className="divide-y divide-[rgba(0,0,0,0.08)] dark:divide-[rgba(255,255,255,0.1)]">
        {/* Header - hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-2 bg-[#f5f5f5] dark:bg-[#2d2d2d] px-4 py-3 font-semibold text-xs uppercase tracking-wide text-[#525252] dark:text-[#a3a3a3] h-12 items-center transition-colors duration-300">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-4 text-right">Unsubscribed</div>
        </div>

        {/* Records */}
        {records.map((record) => (
          <div
            key={record.id}
            className="group grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#f5f5f5] dark:hover:bg-[#2d2d2d] transition-colors items-center md:h-14"
          >
            {/* Name - full width on mobile, 4 cols on desktop */}
            <div className="col-span-12 md:col-span-4 min-w-0">
              <div className="font-semibold text-sm text-[#1a1a1a] dark:text-[#e5e5e5] truncate group-hover:text-[#7bb3f5] dark:group-hover:text-[#0066cc] transition-colors">{record.sender_name}</div>
              <div className="text-xs text-[#737373] dark:text-[#a3a3a3] truncate md:hidden">
                {record.sender_email}
              </div>
            </div>

            {/* Email - hidden on mobile */}
            <div className="hidden md:block md:col-span-4 min-w-0">
              <div className="text-sm text-[#737373] dark:text-[#a3a3a3] truncate">{record.sender_email}</div>
            </div>

            {/* Unsubscribed Date */}
            <div className="col-span-12 md:col-span-4 text-right">
              <Badge className="text-xs bg-[#e5e5e5] dark:bg-[#2d2d2d] text-[#1a1a1a] dark:text-[#e5e5e5] font-medium">
                {new Date(record.unsubscribed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
