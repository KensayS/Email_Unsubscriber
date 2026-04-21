import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const AVATAR_COLORS = [
  '#e4d8fd',
  '#d4e8f7',
  '#fce4ec',
  '#f3e5f5',
  '#e0f2f1',
  '#fff3e0',
]

function getAvatarColor(name: string): string {
  const code = name.charCodeAt(0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

const FAKE_SENDERS = [
  { name: 'Nike', email: 'news@nike.com', count: 87, summary: 'Weekly athletic gear sales and new product launches.' },
  { name: 'Medium Daily Digest', email: 'noreply@medium.com', count: 64, summary: 'Personalized daily article recommendations based on your reading history.' },
  { name: 'GitHub', email: 'noreply@github.com', count: 51, summary: 'Repository activity digests, security alerts, and team notifications.' },
]

export function MockDashboard() {
  return (
    <div className="w-full rounded-[20px] border border-[rgba(38,17,74,0.08)] bg-white dark:bg-[#1a1428] shadow-xl dark:shadow-2xl dark:shadow-[#7e43ff]/10 overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-[rgba(38,17,74,0.08)] dark:border-[rgba(167,139,250,0.15)] px-4 py-3 bg-[#f5f0ff] dark:bg-[#2d1b4e]">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="text-center text-xs text-[#9491a1] dark:text-[#b8a7d6] font-mono flex-1">
          unsubscriber.app/dashboard
        </div>
      </div>

      {/* App content */}
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 rounded-[8px] border border-[rgba(38,17,74,0.12)] bg-white dark:bg-[#2d1b4e] text-xs flex items-center px-3 text-[#9491a1] dark:text-[#b8a7d6] font-medium">
              1 month ▾
            </div>
            <div className="h-8 w-20 rounded-[8px] bg-[#26114a] text-white text-xs flex items-center justify-center font-medium">
              Scan
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-[8px] border border-[rgba(38,17,74,0.12)] dark:border-[rgba(167,139,250,0.15)] bg-[#f5f0ff] dark:bg-[#2d1b4e] p-1">
              <div className="h-8 px-2 rounded-[6px] text-xs font-medium bg-[#26114a] text-white flex items-center justify-center">
                ▦▦▦
              </div>
              <div className="h-8 px-2 rounded-[6px] text-xs font-medium text-[#9491a1] dark:text-[#b8a7d6] flex items-center justify-center">
                ☰
              </div>
            </div>
            <button className="text-xl hover:opacity-70">⚠️</button>
          </div>
        </div>

        {/* Grid View */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#9491a1] dark:text-[#b8a7d6]">Grid View</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAKE_SENDERS.map((sender) => {
              const initial = sender.name[0]?.toUpperCase() || 'U'
              const avatarColor = getAvatarColor(sender.name)
              return (
                <div
                  key={sender.email}
                  className="rounded-[16px] border border-[rgba(38,17,74,0.08)] dark:border-[rgba(167,139,250,0.15)] bg-white dark:bg-[#1a1428] shadow-[0_1px_6px_rgba(38,17,74,0.07)] dark:shadow-lg dark:shadow-[#7e43ff]/10 hover:shadow-[0_4px_16px_rgba(38,17,74,0.12)] dark:hover:shadow-[0_8px_24px_rgba(167,139,250,0.15)] transition-all overflow-hidden flex flex-col"
                >
                  {/* Avatar header */}
                  <div
                    className="w-full h-14 flex items-center justify-center"
                    style={{ backgroundColor: avatarColor }}
                  >
                    <div className="w-11 h-11 rounded-full bg-white dark:bg-[#0f0a1a] flex items-center justify-center shadow-md">
                      <span className="text-base font-bold text-[#26114a] dark:text-[#a78bfa]">{initial}</span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div>
                      <h3 className="font-semibold text-sm text-[#26114a] dark:text-[#f5f3ff] line-clamp-1">{sender.name}</h3>
                      <p className="text-xs text-[#9491a1] dark:text-[#b8a7d6] mt-1 line-clamp-1">{sender.email}</p>
                    </div>
                    <p className="text-xs text-[#9491a1] dark:text-[#b8a7d6] line-clamp-2 italic opacity-80">"{sender.summary}"</p>
                    <div className="flex items-center gap-2 mt-auto">
                      <Badge className="text-xs bg-[#e4d8fd] dark:bg-[#7e43ff]/30 text-[#26114a] dark:text-[#c084fc] font-medium">
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
              )
            })}
          </div>
        </div>

        {/* List View */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#9491a1] dark:text-[#b8a7d6]">List View</p>
          <div className="rounded-[16px] border border-[rgba(38,17,74,0.08)] dark:border-[rgba(167,139,250,0.15)] bg-white dark:bg-[#1a1428] overflow-hidden">
            <div className="divide-y divide-[rgba(38,17,74,0.08)] dark:divide-[rgba(167,139,250,0.15)]">
              <div className="hidden md:grid grid-cols-12 gap-2 bg-[#f5f0ff] dark:bg-[#2d1b4e] px-4 py-3 font-semibold text-xs uppercase tracking-wide text-[#26114a] dark:text-[#c084fc] h-12 items-center">
                <div className="col-span-4">Name</div>
                <div className="col-span-4">Email</div>
                <div className="col-span-2 text-right">Count</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {FAKE_SENDERS.map((sender) => {
                const initial = sender.name[0]?.toUpperCase() || 'U'
                const avatarColor = getAvatarColor(sender.name)
                return (
                  <div
                    key={sender.email}
                    className="group grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#f5f0ff] dark:hover:bg-[#2d1b4e] transition-colors items-center md:h-14"
                  >
                    <div className="col-span-12 md:col-span-4 min-w-0 flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[#26114a] dark:text-[#f5f3ff] truncate group-hover:text-[#7e43ff] dark:group-hover:text-[#c084fc] transition-colors">{sender.name}</div>
                        <button className="text-xs text-[#7e43ff] dark:text-[#c084fc] hover:underline truncate text-left opacity-80 hover:opacity-100 transition-opacity">
                          See details
                        </button>
                      </div>
                    </div>

                    <div className="hidden md:block md:col-span-4 min-w-0">
                      <div className="text-sm text-[#9491a1] dark:text-[#b8a7d6] truncate">{sender.email}</div>
                    </div>

                    <div className="col-span-3 md:col-span-2 text-right">
                      <Badge className="text-xs bg-[#e4d8fd] dark:bg-[#7e43ff]/30 text-[#26114a] dark:text-[#c084fc] font-medium">
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
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
