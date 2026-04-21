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
          unsubscriber.app/dashboard
        </div>
      </div>

      {/* App content */}
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 rounded-[8px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#2d2d2d] text-xs flex items-center px-3 text-[#737373] dark:text-[#a3a3a3] font-medium">
              1 month ▾
            </div>
            <div className="h-8 w-20 rounded-[8px] bg-[#1a1a1a] dark:bg-[#d4d4d4] text-white dark:text-[#0f0f0f] text-xs flex items-center justify-center font-medium">
              Scan
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-[8px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-[#f5f5f5] dark:bg-[#2d2d2d] p-1">
              <div className="h-8 px-2 rounded-[6px] text-xs font-medium bg-[#1a1a1a] dark:bg-[#d4d4d4] text-white dark:text-[#0f0f0f] flex items-center justify-center">
                ▦▦▦
              </div>
              <div className="h-8 px-2 rounded-[6px] text-xs font-medium text-[#737373] dark:text-[#a3a3a3] flex items-center justify-center">
                ☰
              </div>
            </div>
            <button className="text-xl hover:opacity-70">⚠️</button>
          </div>
        </div>

        {/* Grid View */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3]">Grid View</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAKE_SENDERS.map((sender) => (
              <div
                key={sender.email}
                className="rounded-[12px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#1a1a1a] shadow-sm dark:shadow-sm hover:shadow-md dark:hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                {/* Content */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="font-semibold text-sm text-[#1a1a1a] dark:text-[#e5e5e5] line-clamp-1">{sender.name}</h3>
                    <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-1 line-clamp-1">{sender.email}</p>
                  </div>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3] line-clamp-2 italic opacity-80">"{sender.summary}"</p>
                  <div className="flex items-center gap-2 mt-auto">
                    <Badge className="text-xs bg-[#e5e5e5] dark:bg-[#2d2d2d] text-[#1a1a1a] dark:text-[#e5e5e5] font-medium">
                      {sender.count}
                    </Badge>
                  </div>
                </div>
                {/* Button */}
                <div className="px-5 pb-5 pt-0">
                  <Button
                    size="sm"
                    className="w-full text-xs h-9 font-medium pointer-events-none"
                  >
                    Unsubscribe
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* List View */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3]">List View</p>
          <div className="rounded-[12px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#1a1a1a] overflow-hidden">
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
                    <div className="font-semibold text-sm text-[#1a1a1a] dark:text-[#e5e5e5] truncate group-hover:text-[#6b5b95] dark:group-hover:text-[#8b7bb8] transition-colors">{sender.name}</div>
                    <button className="text-xs text-[#6b5b95] dark:text-[#8b7bb8] hover:underline truncate text-left opacity-80 hover:opacity-100 transition-opacity">
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
      </div>
    </div>
  )
}
