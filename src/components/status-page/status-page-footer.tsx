import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'

interface StatusPageFooterProps {
  lastRefresh: Date
}

export function StatusPageFooter({ lastRefresh }: StatusPageFooterProps) {
  const handleGetStarted = () => {
    if (typeof window !== 'undefined') {
      window.location.href = 'https://app.bareuptime.co/signin'
    }
  }

  return (
    <div className="py-12 text-center">
      <p className="mb-4 text-sm text-muted-foreground">
        Last refresh: {lastRefresh.toLocaleString()}
      </p>

      <div className="mx-auto mb-6 max-w-md">
        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="mb-2 text-center text-lg font-semibold">
            Monitor Your Services
          </h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Create your own uptime monitoring dashboard with worldwide coverage and instant alerts.
          </p>
          <Button onClick={handleGetStarted} className="w-full">
            Get Started Free
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Powered by{' '}
        <span className="font-medium text-primary">BareUptime</span>
      </p>
    </div>
  )
}
