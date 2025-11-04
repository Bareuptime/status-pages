import { BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { StatusPagePublicResponse } from '@/lib/types'
import { getOverallStatus } from '@/lib/status-page-utils'
import { StatusHeader } from './status-header'
import { StatisticsOverview } from './statistics-overview'
import { MonitorList } from './monitor-list'
import { StatusPageFooter } from './status-page-footer'

interface StatusPageLayoutProps {
  statusPage: StatusPagePublicResponse
  lastRefresh: Date
  onRefresh: () => void
}

export function StatusPageLayout({ statusPage, lastRefresh, onRefresh }: StatusPageLayoutProps) {
  const overallStatus = getOverallStatus(statusPage.statistics)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StatusHeader
        name={statusPage.name}
        description={statusPage.description}
        overallStatus={overallStatus}
        lastUpdated={statusPage.statistics.last_updated}
        onRefresh={onRefresh}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {/* Statistics Overview */}
        <StatisticsOverview statistics={statusPage.statistics} />

        {/* Monitors Status */}
        <TooltipProvider>
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Service Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonitorList monitors={statusPage.monitors} />
            </CardContent>
          </Card>
        </TooltipProvider>

        {/* Footer */}
        <StatusPageFooter lastRefresh={lastRefresh} />
      </div>
    </div>
  )
}
