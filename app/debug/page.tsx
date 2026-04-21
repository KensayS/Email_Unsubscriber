'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [sessionData, setSessionData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Log to console immediately
    console.log('[DEBUG] useSession hook status:', status)
    console.log('[DEBUG] useSession hook data:', session)

    // Fetch session directly from API
    fetch('/api/auth/session')
      .then((res) => {
        console.log('[DEBUG] /api/auth/session response status:', res.status)
        return res.json()
      })
      .then((data) => {
        console.log('[DEBUG] /api/auth/session response data:', data)
        setSessionData(data)
      })
      .catch((err) => {
        console.error('[DEBUG] /api/auth/session error:', err)
        setError(err.message)
      })
  }, [session, status])

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug Page</h1>

      <div className="space-y-6">
        {/* useSession Hook Status */}
        <div className="border rounded p-4 bg-gray-50">
          <h2 className="font-bold mb-2">useSession Hook</h2>
          <p className="text-sm mb-2">
            <strong>Status:</strong> {status}
          </p>
          <pre className="bg-white p-3 rounded text-xs border overflow-auto max-h-48">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        {/* Direct API Call */}
        <div className="border rounded p-4 bg-gray-50">
          <h2 className="font-bold mb-2">/api/auth/session</h2>
          {error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : (
            <pre className="bg-white p-3 rounded text-xs border overflow-auto max-h-48">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          )}
        </div>

        {/* Instructions */}
        <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
          <h2 className="font-bold mb-2">Instructions:</h2>
          <ol className="text-sm space-y-1">
            <li>1. Open your browser DevTools (F12)</li>
            <li>2. Go to the Console tab</li>
            <li>3. Sign in with Google on the home page</li>
            <li>4. Come back to this page immediately after login</li>
            <li>5. Take a screenshot of the console logs and this page</li>
            <li>6. Look for any [DEBUG] messages showing session data</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
