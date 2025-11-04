import { StatusPagePublicResponse, StatusPageMonitorPublic, StatusPageHistorical, StatusPageMonitorPublicRegionStats } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api1.bareuptime.co'

// Process monitor data to calculate aggregated statistics and group by region
function processMonitorData(monitor: StatusPageMonitorPublic): StatusPageMonitorPublic {
  let totalChecks = 0
  let accumulatedResponseTime = 0
  let accumulatedUptime = 0
  const monitorByRegion: Record<string, StatusPageHistorical[]> = {}

  monitor.historical_data = monitor.historical_data || []

  // Sort in chronological order to ensure last entry is most recent
  monitor.historical_data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Process each historical data point
  for (let data of monitor.historical_data) {
    totalChecks += data.total_checks
    accumulatedResponseTime += data.avg_response_time_ms * data.total_checks
    accumulatedUptime += data.uptime_percent * data.total_checks
    data.last_checked = data.last_checked || data.timestamp

    // Group by region
    if (data.region) {
      if (!monitorByRegion[data.region]) {
        monitorByRegion[data.region] = []
      }
      monitorByRegion[data.region].push(data)
    }
  }

  // Calculate weighted averages
  monitor.total_checks = totalChecks
  monitor.avg_response_time_ms = totalChecks === 0 ? 0 : accumulatedResponseTime / totalChecks
  monitor.uptime_percentage = totalChecks === 0 ? 0 : accumulatedUptime / totalChecks
  monitor.last_checked = monitor.historical_data.length > 0
    ? monitor.historical_data[monitor.historical_data.length - 1].last_checked
    : undefined

  // Convert region map to array
  monitor.historical_data_by_region = []
  for (let region in monitorByRegion) {
    const regionData = monitorByRegion[region]
    monitor.historical_data_by_region.push({
      region: region,
      monitors: regionData,
    })
  }

  // Clear historical_data as it's now in historical_data_by_region
  monitor.historical_data = []

  return monitor
}

export async function getPublicStatusPage(key: string): Promise<StatusPagePublicResponse> {
  const url = `${API_URL}/status/${key}`
  console.log('Fetching status page from URL:', url)

  const response = await fetch(url, {
    cache: 'no-store', // Disable caching for real-time data
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Status page not found')
    }
    throw new Error(`Failed to fetch status page: ${response.statusText}`)
  }

  const data = await response.json()

  // Process monitors to calculate aggregated statistics and group by region
  if (data.monitors && Array.isArray(data.monitors)) {
    let accumulatedUptime = 0

    for (let monitor of data.monitors) {
      processMonitorData(monitor)
      accumulatedUptime += monitor.uptime_percentage
    }

    // Calculate overall uptime percentage
    data.statistics.overall_uptime_percent = data.monitors.length === 0
      ? 0
      : accumulatedUptime / data.monitors.length
  }

  return data
}
