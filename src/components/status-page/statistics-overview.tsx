import {
  CheckCircle2,
  AlertCircle,
  Globe,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StatusPageStatistics } from '@/lib/types'
import { formatUptime } from '@/lib/status-page-utils'

interface StatisticsOverviewProps {
  statistics: StatusPageStatistics
}

export function StatisticsOverview({ statistics }: StatisticsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total monitors</p>
              <p className="text-2xl font-semibold">{statistics.total_monitors}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 dark:bg-emerald-500/15">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Online</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
                {statistics.online_monitors}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 dark:bg-red-500/15">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-300">
                {statistics.offline_monitors}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 dark:bg-amber-500/15">
              <TrendingUp className="h-5 w-5 text-amber-500 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall uptime</p>
              <p className="text-2xl font-semibold">
                {formatUptime(statistics.overall_uptime_percent)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
