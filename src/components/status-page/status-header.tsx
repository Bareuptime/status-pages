import { CheckCircle2, AlertCircle, RefreshCw, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { OverallStatus, formatDate } from '@/lib/status-page-utils'

interface StatusHeaderProps {
  name: string
  description?: string
  overallStatus: OverallStatus
  lastUpdated: string
  onRefresh: () => void
}

export function StatusHeader({
  name,
  description,
  overallStatus,
  lastUpdated,
  onRefresh
}: StatusHeaderProps) {
  return (
    <>
      {/* BareUptime Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Left Section - BareUptime Branding */}
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">BareUptime</h1>
              <p className="text-xs text-muted-foreground">Monitor your services worldwide</p>
            </div>
          </div>

          {/* Right Section - Theme Toggle & Auth Buttons */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = 'https://bareuptime.co/signin'}
              className="hover:bg-muted"
            >
              Sign in
            </Button>
            <Button
              size="sm"
              onClick={() => window.location.href = 'https://bareuptime.co/signin'}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Status Page Header + Overall Status */}
      <Card className="border border-border bg-card">
        <div className="mx-auto max-w-6xl border-b border-border/60 px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">{name}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>

            {/* Centered overall status message */}
            <div className="flex-1 flex items-center justify-center">
              <div className={`inline-flex items-center space-x-2 ${overallStatus.color}`}>
                {overallStatus.status === 'operational' ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
                <span className="text-lg font-medium">{overallStatus.message}</span>
              </div>
            </div>

            <div>
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">Last updated: {formatDate(lastUpdated)}</p>
          </div>
        </div>
      </Card>
    </>
  )
}
