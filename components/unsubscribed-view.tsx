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
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-sm text-[#9491a1] dark:text-[#b8a7d6] animate-pulse">Loading unsubscribed senders…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-lg border border-[rgba(38,17,74,0.12)] dark:border-[rgba(167,139,250,0.15)] bg-[#f5f0ff] dark:bg-[#2d1b4e] p-4">
        <div className="text-sm text-[#26114a] dark:text-[#c084fc]">Error loading unsubscribes: {error}</div>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-sm text-[#9491a1] dark:text-[#b8a7d6]">✓ All clean! No unsubscribes yet</div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg border border-[rgba(38,17,74,0.08)] dark:border-[rgba(167,139,250,0.15)] bg-white dark:bg-[#1a1428] overflow-hidden shadow-sm dark:shadow-lg dark:shadow-[#7e43ff]/10 transition-all duration-300">
      <div className="divide-y divide-[rgba(38,17,74,0.08)] dark:divide-[rgba(167,139,250,0.15)]">
        {/* Header - hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-2 bg-[#f5f0ff] dark:bg-[#2d1b4e] px-4 py-3 font-semibold text-xs uppercase tracking-wide text-[#26114a] dark:text-[#c084fc] h-12 items-center transition-colors duration-300">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-4 text-right">Unsubscribed</div>
        </div>

        {/* Records */}
        {records.map((record) => (
          <div
            key={record.id}
            className="group grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#f5f0ff] dark:hover:bg-[#2d1b4e] transition-colors items-center md:h-14"
          >
            {/* Name - full width on mobile, 4 cols on desktop */}
            <div className="col-span-12 md:col-span-4 min-w-0">
              <div className="font-semibold text-sm text-[#26114a] dark:text-[#f5f3ff] truncate group-hover:text-[#7e43ff] dark:group-hover:text-[#c084fc] transition-colors">{record.sender_name}</div>
              <div className="text-xs text-[#9491a1] dark:text-[#b8a7d6] truncate md:hidden">
                {record.sender_email}
              </div>
            </div>

            {/* Email - hidden on mobile */}
            <div className="hidden md:block md:col-span-4 min-w-0">
              <div className="text-sm text-[#9491a1] dark:text-[#b8a7d6] truncate">{record.sender_email}</div>
            </div>

            {/* Unsubscribed Date */}
            <div className="col-span-12 md:col-span-4 text-right">
              <Badge className="text-xs bg-[#e4d8fd] dark:bg-[#7e43ff]/30 text-[#26114a] dark:text-[#c084fc] font-medium">
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
