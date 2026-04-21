import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { MockDashboard } from '@/components/mock-dashboard'
import { SignInButton } from '@/components/sign-in-button'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-16 gap-12 bg-background dark:bg-background transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {/* Hero */}
      <div className="text-center max-w-lg mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-block mb-6 px-4 py-2 rounded-full border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-[#f5f5f5] dark:bg-[#2d2d2d] text-[#525252] dark:text-[#a3a3a3] text-xs font-semibold tracking-wide uppercase opacity-80 hover:opacity-100 transition-opacity">
          ✉ Stop Unwanted Emails
        </div>
        <h1 className="text-6xl md:text-7xl font-bold text-[#1a1a1a] dark:text-[#e5e5e5] tracking-tighter mb-4 leading-tight">
          Reclaim Your<br className="hidden sm:block" />
          Inbox
        </h1>
        <p className="text-[#737373] dark:text-[#a3a3a3] text-lg md:text-xl mb-10 leading-relaxed max-w-md mx-auto">
          I'll scan your Gmail, show you every mailing list you're signed up for, and let you unsubscribe from all of them in seconds. One click per email. That's it.
        </p>
        <div className="transform hover:scale-105 transition-transform duration-200">
          <SignInButton />
        </div>
      </div>

      {/* Mock preview */}
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
        <p className="text-center text-sm text-[#737373] dark:text-[#a3a3a3] mb-4 font-medium">Here's how it works</p>
        <div className="rounded-[12px] overflow-hidden shadow-lg dark:shadow-lg group hover:shadow-xl transition-all duration-300">
          <MockDashboard />
        </div>
      </div>
    </main>
  )
}
