import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const FAKE_SENDERS = [
  { name: 'Nike', email: 'news@nike.com', count: 87, summary: 'Weekly athletic gear sales and new product launches.' },
  { name: 'Medium Daily Digest', email: 'noreply@medium.com', count: 64, summary: 'Personalized daily article recommendations based on your reading history.' },
  { name: 'GitHub', email: 'noreply@github.com', count: 51, summary: 'Repository activity digests, security alerts, and team notifications.' },
  { name: 'Airbnb', email: 'no-reply@airbnb.com', count: 38, summary: 'Travel deal recommendations and booking reminders.' },
  { name: 'Duolingo', email: 'hello@duolingo.com', count: 30, summary: 'Daily streak reminders and language learning progress updates.' },
]

export function MockDashboard() {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border bg-background shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 bg-muted/30 justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="text-center text-xs text-muted-foreground font-mono flex-1">
          unsubscriber.app/dashboard
        </div>
        <div className="text-right"></div>
      </div>
      {/* App chrome */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-4 flex-wrap justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 rounded-md border bg-muted text-xs flex items-center px-3 text-muted-foreground">
              1 month ▾
            </div>
            <div className="h-8 w-20 rounded-md bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              Scan
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-md border bg-muted/50 p-1">
            <div className="h-8 px-2 rounded text-xs font-medium bg-primary text-primary-foreground flex items-center justify-center">
              🏗️
            </div>
            <div className="h-8 px-2 rounded text-xs font-medium text-muted-foreground flex items-center justify-center">
              📋
            </div>
            <div className="h-8 px-2 rounded text-xs font-medium text-muted-foreground flex items-center justify-center">
              ☰
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {FAKE_SENDERS.reduce((s, x) => s + x.count, 0)} found
          </span>
        </div>

        {/* Session warning */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
          <strong>Note:</strong> Unsubscribed lists still appear here since we don't store data.
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Sender</th>
                  <th className="text-left px-3 py-2 font-semibold">Email</th>
                  <th className="text-right px-3 py-2 font-semibold w-16">Count</th>
                  <th className="text-right px-3 py-2 font-semibold w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {FAKE_SENDERS.map((sender) => (
                  <tr key={sender.email} className="border-b hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="font-medium truncate">{sender.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{sender.summary}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground truncate text-xs">{sender.email}</td>
                    <td className="px-3 py-2 text-right">
                      <Badge variant="secondary" className="text-xs">{sender.count}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="default" className="text-xs h-7 px-2 pointer-events-none">
                        Unsubscribe
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
