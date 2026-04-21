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
        <div className="text-sm text-muted-foreground">Loading unsubscribed senders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="text-sm text-red-800">Error loading unsubscribes: {error}</div>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">No unsubscribes yet</div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg border bg-card overflow-hidden">
      <div className="divide-y">
        {/* Header - hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-2 bg-muted/40 px-4 py-3 font-semibold text-sm h-12 items-center">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-4 text-right">Unsubscribed</div>
        </div>

        {/* Records */}
        {records.map((record) => (
          <div
            key={record.id}
            className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/40 transition-colors items-center md:h-14"
          >
            {/* Name - full width on mobile, 4 cols on desktop */}
            <div className="col-span-12 md:col-span-4 min-w-0">
              <div className="font-medium text-sm truncate">{record.sender_name}</div>
              <div className="text-xs text-muted-foreground truncate md:hidden">
                {record.sender_email}
              </div>
            </div>

            {/* Email - hidden on mobile */}
            <div className="hidden md:block md:col-span-4 min-w-0">
              <div className="text-sm text-muted-foreground truncate">{record.sender_email}</div>
            </div>

            {/* Unsubscribed Date */}
            <div className="col-span-12 md:col-span-4 text-right">
              <Badge variant="secondary" className="text-xs">
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
