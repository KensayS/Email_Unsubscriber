import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { MockDashboard } from '@/components/mock-dashboard'
import { SignInButton } from '@/components/sign-in-button'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start px-4 py-16 gap-12 dark:bg-[#0f0a1a] transition-colors duration-300"
      style={{
        background: 'linear-gradient(150deg, #efeffff 0%, #e9e2ff 30%, #ffe1f1 70%, #fff6f5 100%)',
      }}
    >
      {/* Hero */}
      <div className="text-center max-w-lg mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-block mb-6 px-4 py-2 rounded-full border border-[rgba(38,17,74,0.16)] bg-transparent text-[#26114a] dark:text-[#a78bfa] dark:border-[rgba(167,139,250,0.3)] text-xs font-semibold tracking-wide uppercase opacity-80 hover:opacity-100 transition-opacity">
          ✉ Inbox Cleaner
        </div>
        <h1 className="text-6xl md:text-7xl font-bold text-[#26114a] dark:text-[#f5f3ff] tracking-tighter mb-4 leading-tight">
          Inbox Zero,<br className="hidden sm:block" />
          Finally.
        </h1>
        <p className="text-[#9491a1] dark:text-[#b8a7d6] text-lg md:text-xl mb-10 leading-relaxed max-w-md mx-auto">
          Sign in with Gmail, see every mailing list you're on, and unsubscribe in one click. No data stored. Ever.
        </p>
        <div className="transform hover:scale-105 transition-transform duration-200">
          <SignInButton />
        </div>
      </div>

      {/* Mock preview */}
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
        <p className="text-center text-sm text-[#9491a1] dark:text-[#b8a7d6] mb-4 font-medium">See what you'll build</p>
        <div className="rounded-[20px] overflow-hidden shadow-2xl dark:shadow-2xl dark:shadow-[#7e43ff]/20 group hover:shadow-3xl transition-all duration-300">
          <MockDashboard />
        </div>
      </div>
    </main>
  )
}
