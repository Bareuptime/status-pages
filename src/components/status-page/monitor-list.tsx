import {
  CheckCircle2,
  AlertCircle,
  Globe
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  StatusPageMonitorPublic,
  MonitorStatusEnum
} from '@/lib/types'
import {
  formatUptime,
  formatResponseTime,
  formatTotalChecks,
  formatDate,
  getUptimeColor
} from '@/lib/status-page-utils'

// Determine display granularity based on time range between first and last data points
function getTimeGranularity(dataPoints: any[]): string {
  if (!dataPoints || dataPoints.length < 2) return 'in minutes'

  // derive earliest and latest timestamps safely
  let minTs = Infinity
  let maxTs = -Infinity

  for (const d of dataPoints) {
    const t = new Date(d.timestamp).getTime()
    if (!isNaN(t)) {
      if (t < minTs) minTs = t
      if (t > maxTs) maxTs = t
    }
  }

  if (!isFinite(minTs) || !isFinite(maxTs) || minTs === maxTs) return 'in minutes'

  const diffMs = maxTs - minTs
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diffMs <= 6 * hour) return 'in minutes'
  if (diffMs <= 3 * day) return 'in hours'
  return 'in days'
}

// Format a human-friendly label for the time range covered by dataPoints.
// Examples: "120 minute uptime history", "10 hrs uptime history", "7 days uptime history".
function formatTimeRangeLabel(dataPoints: any[]): string {
  if (!dataPoints || dataPoints.length === 0) return 'uptime history'

  let minTs = Infinity
  let maxTs = -Infinity

  for (const d of dataPoints) {
    const t = new Date(d.timestamp).getTime()
    if (!isNaN(t)) {
      if (t < minTs) minTs = t
      if (t > maxTs) maxTs = t
    }
  }

  if (!isFinite(minTs) || !isFinite(maxTs) || minTs === maxTs) return '1 minute uptime history'

  const diffMs = maxTs - minTs
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs <= 6 * hour) {
    const mins = Math.max(1, Math.round(diffMs / minute))
    return `${mins} minute${mins === 1 ? '' : 's'} uptime history`
  }

  if (diffMs <= 3 * day) {
    const hrs = Math.max(1, Math.round(diffMs / hour))
    return `${hrs} hrs uptime history`
  }

  const days = Math.max(1, Math.round(diffMs / day))
  return `${days} days uptime history`
}

interface MonitorCardProps {
  monitor: StatusPageMonitorPublic
}

export function MonitorCard({ monitor }: MonitorCardProps) {
  const statusStyles =
    monitor.status === MonitorStatusEnum.ONLINE
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300'
      : 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-300'

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-col space-y-4 pb-0">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">{monitor.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{monitor.url}</p>
            </div>
            <Badge className={statusStyles}>
              {monitor.status === MonitorStatusEnum.ONLINE ? (
                <>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Online
                </>
              ) : (
                <>
                  <AlertCircle className="mr-1 h-4 w-4" />
                  Offline
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Total checks" value={formatTotalChecks(monitor.total_checks)} />
          <StatTile label="Check interval" value={monitor.check_interval} />
          <StatTile label="Last checked" value={monitor.last_checked ? formatDate(monitor.last_checked) : 'N/A'} />
          <StatTile label="SSL expiry" value={monitor.ssl_expiry_date ? formatDate(monitor.ssl_expiry_date) : 'N/A'} />
          <StatTile label="Response time" value={formatResponseTime(monitor.avg_response_time_ms)} />
          <StatTile label="Uptime" value={formatUptime(monitor.uptime_percentage)} />
        </div>

        {monitor.historical_data_by_region && monitor.historical_data_by_region.length > 0 && (
          <div className="space-y-6">
            {monitor.historical_data_by_region.map((regionData, index) => {
              const recent = (regionData.monitors || []).slice(-30)
              const rangeLabel = formatTimeRangeLabel(regionData.monitors)

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {regionData.region}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rangeLabel}
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-[2px]">
                    {recent.map((data, dataIndex) => {
                      const uptimeColor = getUptimeColor(data.uptime_percent)
                      const bucketResponseMs = (data as any).avg_response_time_ms ?? monitor.avg_response_time_ms

                      return (
                        <Tooltip key={dataIndex}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-4 flex-1 rounded-sm transition-all hover:opacity-80 ${uptimeColor.light} ${uptimeColor.dark}`}
                              tabIndex={0}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="p-3">
                            <div className="space-y-1.5 text-xs">
                              <div className="font-medium text-foreground">
                                {formatDate(data.timestamp)}
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                <span className="text-muted-foreground">Uptime:</span>
                                <span className="font-medium text-foreground">{formatUptime(data.uptime_percent)}</span>
                                <span className="text-muted-foreground">Response:</span>
                                <span className="font-medium text-foreground">{formatResponseTime(bucketResponseMs)}</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

interface MonitorListProps {
  monitors: StatusPageMonitorPublic[]
}

export function MonitorList({ monitors }: MonitorListProps) {
  if (monitors.length === 0) {
    return (
      <div className="py-8 text-center">
        <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No monitors configured for this status page</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {monitors.map((monitor) => (
        <MonitorCard key={monitor.id} monitor={monitor} />
      ))}
    </div>
  )
}
