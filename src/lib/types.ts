// Monitor status enums
export enum MonitorStatusEnum {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

// Status Page types
export interface StatusPageHistorical {
  timestamp: string
  total_checks: number
  successful_checks: number
  uptime_percent: number
  avg_response_time_ms: number
  last_checked: string
  region: string
}

export interface StatusPageMonitorPublicRegionStats {
  region: string
  monitors: StatusPageHistorical[]
}

export interface StatusPageMonitorPublic {
  id: number
  name: string
  url: string
  status: MonitorStatusEnum
  last_checked?: string
  ssl_expiry_date?: string
  created_at: string
  check_interval: '1min' | '5min' | '10min' | '20min'| '30min'  | '1hr'
  uptime_percentage: number
  avg_response_time_ms: number
  total_checks: number
  historical_data?: StatusPageHistorical[]
  historical_data_by_region?: StatusPageMonitorPublicRegionStats[]
}

export interface StatusPageStatistics {
  total_monitors: number
  online_monitors: number
  offline_monitors: number
  overall_uptime_percent: number
  avg_response_time_ms: number
  last_updated: string
}

export interface StatusPagePublicResponse {
  name: string
  description?: string
  key: string
  updated_at: string
  monitors: StatusPageMonitorPublic[]
  statistics: StatusPageStatistics
}
