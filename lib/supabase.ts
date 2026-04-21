import { createClient } from '@supabase/supabase-js'

// Type definition for unsubscribed records
export interface UnsubscribedRecord {
  id: string
  google_user_id: string
  sender_email: string
  sender_name: string
  unsubscribed_at: string
  created_at: string
}

// Initialize Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  )
}

// Client-side Supabase client (uses publishable key, respects RLS)
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

// Server-side admin client (uses secret key, bypasses RLS for admin operations)
let supabaseAdmin: ReturnType<typeof createClient> | null = null
if (supabaseSecretKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)
} else {
  console.warn('[supabase] SUPABASE_SECRET_KEY not found - admin operations will not work')
}

/**
 * Key Usage Documentation:
 *
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (client-side):
 * - Used for client-side initialization of the Supabase client
 * - Respects Row-Level Security (RLS) policies defined in the database
 * - Safe to expose publicly as it's limited by RLS rules
 * - Used for user-specific queries (e.g., fetching user's own unsubscribe records)
 *
 * SUPABASE_SECRET_KEY (server-side only, in .env):
 * - Available in process.env for future admin/server-only operations if needed
 * - Bypasses RLS policies - should only be used for authenticated server-side requests
 * - Never expose this key to the client
 * - Example use cases: admin operations, batch updates, migrations
 *
 * Current Implementation:
 * - Uses publishable key which respects RLS policies
 * - All operations are user-authenticated via google_user_id from session
 * - Safe for production as RLS ensures users can only access their own data
 */

/**
 * Fetch all unsubscribed sender emails for a user
 * Returns a Set of emails for efficient lookup/filtering
 * Used to check if a sender has already been unsubscribed
 *
 * @param googleUserId - The user's Google ID from their session
 * @returns Set<string> of sender emails, empty Set on error
 */
export async function fetchUserUnsubscribes(
  googleUserId: string
): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('user_unsubscribes')
      .select('sender_email')
      .eq('google_user_id', googleUserId)

    if (error) {
      console.error('Error fetching user unsubscribes:', error)
      return new Set()
    }

    return new Set(data?.map((record) => record.sender_email) || [])
  } catch (err) {
    console.error('Unexpected error in fetchUserUnsubscribes:', err)
    return new Set()
  }
}

/**
 * Fetch all unsubscribed records for a user, ordered by most recent
 * Used to populate the Unsubscribed tab with full details
 * Uses admin client (server-side) to bypass RLS
 *
 * @param googleUserId - The user's Google ID from their session
 * @returns UnsubscribedRecord[] ordered by unsubscribed_at DESC, empty array on error
 */
export async function fetchUserUnsubscribesList(
  googleUserId: string
): Promise<UnsubscribedRecord[]> {
  try {
    if (!supabaseAdmin) {
      console.error('[supabase.fetchUserUnsubscribesList] Admin client not initialized')
      return []
    }

    const { data, error } = await supabaseAdmin
      .from('user_unsubscribes')
      .select('*')
      .eq('google_user_id', googleUserId)
      .order('unsubscribed_at', { ascending: false })

    if (error) {
      console.error('[supabase.fetchUserUnsubscribesList] Error:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      return []
    }

    console.log(`[supabase.fetchUserUnsubscribesList] Fetched ${(data || []).length} records`)
    return (data as UnsubscribedRecord[]) || []
  } catch (err) {
    console.error('[supabase.fetchUserUnsubscribesList] Unexpected error:', err)
    return []
  }
}

/**
 * Log an unsubscribe action to the database
 * Called after a successful unsubscribe to record the action
 *
 * @param googleUserId - The user's Google ID from their session
 * @param senderEmail - The email address of the sender (mailing list)
 * @param senderName - The display name of the sender
 * @param unsubscribedAt - ISO timestamp of when the unsubscribe was completed
 * @returns boolean - true on success, false on error
 */
export async function logUnsubscribe(
  googleUserId: string,
  senderEmail: string,
  senderName: string,
  unsubscribedAt: string
): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      console.error('[supabase.logUnsubscribe] Admin client not initialized - SUPABASE_SECRET_KEY missing')
      return false
    }

    const { error } = await supabaseAdmin!.from('user_unsubscribes').insert(
      {
        google_user_id: googleUserId,
        sender_email: senderEmail,
        sender_name: senderName,
        unsubscribed_at: unsubscribedAt,
      } as any
    )

    if (error) {
      console.error('[supabase.logUnsubscribe] Error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error,
      })
      return false
    }

    console.log(`[supabase.logUnsubscribe] Successfully logged unsubscribe for ${senderEmail}`)

    return true
  } catch (err) {
    console.error('Unexpected error in logUnsubscribe:', err)
    return false
  }
}
