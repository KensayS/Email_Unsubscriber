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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)

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
 *
 * @param googleUserId - The user's Google ID from their session
 * @returns UnsubscribedRecord[] ordered by unsubscribed_at DESC, empty array on error
 */
export async function fetchUserUnsubscribesList(
  googleUserId: string
): Promise<UnsubscribedRecord[]> {
  try {
    const { data, error } = await supabase
      .from('user_unsubscribes')
      .select('*')
      .eq('google_user_id', googleUserId)
      .order('unsubscribed_at', { ascending: false })

    if (error) {
      console.error('Error fetching user unsubscribes list:', error)
      return []
    }

    return (data as UnsubscribedRecord[]) || []
  } catch (err) {
    console.error('Unexpected error in fetchUserUnsubscribesList:', err)
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
    const { error } = await supabase.from('user_unsubscribes').insert([
      {
        google_user_id: googleUserId,
        sender_email: senderEmail,
        sender_name: senderName,
        unsubscribed_at: unsubscribedAt,
      },
    ])

    if (error) {
      console.error('Error logging unsubscribe:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Unexpected error in logUnsubscribe:', err)
    return false
  }
}
