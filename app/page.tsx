import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { MockDashboard } from '@/components/mock-dashboard'
import { SignInButton } from '@/components/sign-in-button'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-16 gap-12 bg-background">
      {/* Hero */}
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Inbox Zero, Finally.</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Sign in with Gmail, see every mailing list you're on, and unsubscribe in one click.
          No data stored. Ever.
        </p>
        <SignInButton />
      </div>

      {/* Mock preview */}
      <div className="w-full max-w-2xl">
        <p className="text-center text-sm text-muted-foreground mb-4">Here's what it looks like</p>
        <MockDashboard />
      </div>
    </main>
  )
}
