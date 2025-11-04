import { StatusPageStatistics } from './types'

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

export const formatUptime = (uptime?: number): string => {
  if (uptime === undefined || uptime === null) return 'N/A'
  return `${uptime.toFixed(2)}%`
}

export const formatResponseTime = (responseTime?: number): string => {
  if (responseTime === undefined || responseTime === null) return 'N/A'
  return `${(responseTime/1000).toFixed(1)} s`
}

export const formatTotalChecks = (checks?: number): string => {
  if (checks === undefined || checks === null) return 'N/A'
  return checks.toLocaleString()
}

export interface OverallStatus {
  status: 'operational' | 'partial-outage' | 'major-outage' | 'no-monitors' | 'unknown'
  message: string
  color: string
}

export const getOverallStatus = (statistics?: StatusPageStatistics): OverallStatus => {
  if (!statistics) {
    return {
      status: 'unknown',
      message: 'Unknown',
      color: 'text-muted-foreground'
    }
  }

  const { online_monitors, total_monitors } = statistics

  if (total_monitors === 0) {
    return {
      status: 'no-monitors',
      message: 'No Monitors',
      color: 'text-muted-foreground'
    }
  }

  if (online_monitors === total_monitors) {
    return {
      status: 'operational',
      message: 'All Systems Operational',
      color: 'text-emerald-600 dark:text-emerald-300'
    }
  } else if (online_monitors === 0) {
    return {
      status: 'major-outage',
      message: 'Major Outage',
      color: 'text-red-600 dark:text-red-300'
    }
  } else {
    return {
      status: 'partial-outage',
      message: 'Partial Outage',
      color: 'text-amber-600 dark:text-amber-300'
    }
  }
}

export const getUptimeColor = (uptimePercent?: number): { light: string; dark: string } => {
  if (uptimePercent === undefined || uptimePercent === null) {
    return { light: 'bg-gray-300', dark: 'dark:bg-gray-700' }
  }
  if (uptimePercent >= 99) return { light: 'bg-emerald-600', dark: 'dark:bg-emerald-500' }
  if (uptimePercent >= 95) return { light: 'bg-amber-600', dark: 'dark:bg-amber-500' }
  return { light: 'bg-red-600', dark: 'dark:bg-red-500' }
}
