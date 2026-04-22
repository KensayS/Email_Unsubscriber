import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const FAKE_SENDERS = [
  { name: 'Nike', email: 'news@nike.com', count: 87, summary: 'Weekly athletic gear sales and new product launches.' },
  { name: 'Medium Daily Digest', email: 'noreply@medium.com', count: 64, summary: 'Personalized daily article recommendations based on your reading history.' },
  { name: 'GitHub', email: 'noreply@github.com', count: 51, summary: 'Repository activity digests, security alerts, and team notifications.' },
]

export function MockDashboard() {
  return (
    <div className="w-full rounded-[12px] border border-border dark:border-border bg-background dark:bg-card shadow-lg dark:shadow-lg overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border dark:border-border px-4 py-3 bg-secondary dark:bg-muted">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="text-center text-xs text-[#737373] dark:text-[#a3a3a3] font-mono flex-1">
          email-unsubscriber.vercel.app
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-border dark:border-border bg-background dark:bg-card px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3 justify-between">
          <h1 className="font-bold text-xl text-[#1a1a1a] dark:text-[#e5e5e5]">📧 Email Unsubscriber</h1>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2">
            <div className="h-8 w-32 rounded-[8px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#2d2d2d] text-xs flex items-center px-3 text-[#737373] dark:text-[#a3a3a3] font-medium">
              1 month ▾
            </div>
            <div className="h-8 w-20 rounded-[8px] bg-[#1a1a1a] dark:bg-[#d4d4d4] text-white dark:text-[#0f0f0f] text-xs flex items-center justify-center font-medium">
              Scan
            </div>
            <button className="text-xl hover:opacity-70">☀️</button>
            <button className="text-xs font-medium text-destructive border-2 border-destructive px-3 py-1.5 rounded-lg hover:bg-destructive/5">
              Sign out
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-2">
            <div className="h-8 w-28 rounded-[8px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#2d2d2d] text-xs flex items-center px-3 text-[#737373] dark:text-[#a3a3a3] font-medium">
              1 month ▾
            </div>
            <div className="h-8 w-16 rounded-[8px] bg-[#1a1a1a] dark:bg-[#d4d4d4] text-white dark:text-[#0f0f0f] text-xs flex items-center justify-center font-medium">
              Scan
            </div>
            <div className="text-xl">☰</div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="border-b border-border dark:border-border px-4 py-3 flex items-center gap-2">
        <button className="px-4 py-2 rounded-full font-medium text-sm bg-[#1a1a1a] text-white dark:bg-[#d4d4d4] dark:text-[#0f0f0f]">
          Scan Results (12)
        </button>
        <button className="px-4 py-2 rounded-full font-medium text-sm text-[#737373] dark:text-[#a3a3a3]">
          Unsubscribed (3)
        </button>
      </div>

      {/* List View */}
      <div className="rounded-[12px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-background dark:bg-card overflow-hidden mx-4 my-6">
        <div className="divide-y divide-[rgba(0,0,0,0.08)] dark:divide-[rgba(255,255,255,0.1)]">
          <div className="hidden md:grid grid-cols-12 gap-2 bg-[#f5f5f5] dark:bg-[#2d2d2d] px-4 py-3 font-semibold text-xs uppercase tracking-wide text-[#525252] dark:text-[#a3a3a3] h-12 items-center">
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2 text-right">Count</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {FAKE_SENDERS.map((sender) => (
            <div
              key={sender.email}
              className="group grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#f5f5f5] dark:hover:bg-[#2d2d2d] transition-colors items-center md:h-14"
            >
              <div className="col-span-12 md:col-span-4 min-w-0">
                <div className="font-semibold text-sm text-[#1a1a1a] dark:text-[#e5e5e5] truncate group-hover:text-[#0066cc] dark:group-hover:text-[#7bb3f5] transition-colors">{sender.name}</div>
                <button className="text-xs text-[#0066cc] dark:text-[#7bb3f5] hover:underline truncate text-left opacity-80 hover:opacity-100 transition-opacity">
                  See details
                </button>
              </div>

              <div className="hidden md:block md:col-span-4 min-w-0">
                <div className="text-sm text-[#737373] dark:text-[#a3a3a3] truncate">{sender.email}</div>
              </div>

              <div className="col-span-3 md:col-span-2 text-right">
                <Badge className="text-xs bg-[#e5e5e5] dark:bg-[#2d2d2d] text-[#1a1a1a] dark:text-[#e5e5e5] font-medium">
                  {sender.count}
                </Badge>
              </div>

              <div className="col-span-9 md:col-span-2 text-right">
                <Button
                  size="sm"
                  className="text-xs h-8 w-full md:w-auto pointer-events-none"
                >
                  Unsubscribe
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
