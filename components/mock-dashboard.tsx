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
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 text-center text-xs text-muted-foreground font-mono">
          unsubscriber.app/dashboard
        </div>
      </div>
      {/* App chrome */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-32 rounded-md border bg-muted animate-none text-xs flex items-center px-3 text-muted-foreground">
            6 months ▾
          </div>
          <div className="h-8 w-20 rounded-md bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
            Scan
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {FAKE_SENDERS.reduce((s, x) => s + x.count, 0)} emails found
          </span>
        </div>
        {FAKE_SENDERS.map((sender) => (
          <Card key={sender.email} className="w-full opacity-90">
            <CardContent className="flex items-start justify-between gap-4 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{sender.name}</span>
                  <Badge variant="secondary" className="text-xs">{sender.count} emails</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{sender.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sender.summary}</p>
              </div>
              <Button size="sm" variant="default" className="shrink-0 text-xs h-7 px-3 pointer-events-none">
                Unsubscribe
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
