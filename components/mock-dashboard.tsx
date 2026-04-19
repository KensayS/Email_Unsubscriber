import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const FAKE_SENDERS = [
  { name: 'Nike', email: 'news@nike.com', count: 87, summary: 'Weekly athletic gear sales and new product launches.' },
  { name: 'Medium Daily Digest', email: 'noreply@medium.com', count: 64, summary: 'Personalized daily article recommendations based on your reading history.' },
  { name: 'GitHub', email: 'noreply@github.com', count: 51, summary: 'Repository activity digests, security alerts, and team notifications.' },
]

export function MockDashboard() {
  return (
    <div className="w-full rounded-xl border bg-background shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="text-center text-xs text-muted-foreground font-mono flex-1">
          unsubscriber.app/dashboard
        </div>
      </div>

      {/* App content */}
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 rounded-md border bg-muted text-xs flex items-center px-3 text-muted-foreground font-medium">
              1 month ▾
            </div>
            <div className="h-8 w-20 rounded-md bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              Scan
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border bg-muted/50 p-1">
              <div className="h-8 px-2 rounded text-xs font-medium bg-primary text-primary-foreground flex items-center justify-center">
                ▦▦▦
              </div>
              <div className="h-8 px-2 rounded text-xs font-medium text-muted-foreground flex items-center justify-center">
                ☰
              </div>
            </div>
            <button className="text-xl hover:opacity-70">⚠️</button>
          </div>
        </div>

        {/* Grid View */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Grid View</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FAKE_SENDERS.map((sender) => (
              <div
                key={sender.email}
                className="rounded-lg border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">{sender.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{sender.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{sender.summary}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    <Badge variant="secondary" className="text-xs">
                      {sender.count}
                    </Badge>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-0">
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full text-xs h-8 pointer-events-none"
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
          <p className="text-xs font-medium text-muted-foreground">List View</p>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="divide-y">
              <div className="hidden md:grid grid-cols-12 gap-2 bg-muted/40 px-4 py-3 font-semibold text-sm h-12 items-center text-xs">
                <div className="col-span-4">Name</div>
                <div className="col-span-4">Email</div>
                <div className="col-span-2 text-right">Count</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {FAKE_SENDERS.map((sender) => (
                <div
                  key={sender.email}
                  className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/40 transition-colors items-center text-xs md:h-14"
                >
                  <div className="col-span-12 md:col-span-4 min-w-0">
                    <div className="font-medium truncate">{sender.name}</div>
                    <button className="text-blue-600 hover:underline truncate text-left text-xs">
                      See details
                    </button>
                  </div>

                  <div className="hidden md:block md:col-span-4 min-w-0">
                    <div className="text-muted-foreground truncate">{sender.email}</div>
                  </div>

                  <div className="col-span-3 md:col-span-2 text-right">
                    <Badge variant="secondary" className="text-xs">
                      {sender.count}
                    </Badge>
                  </div>

                  <div className="col-span-9 md:col-span-2 text-right">
                    <Button
                      size="sm"
                      variant="default"
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
