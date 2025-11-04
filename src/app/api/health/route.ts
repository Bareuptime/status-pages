import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint
 * Used by Kubernetes liveness and readiness probes
 *
 * Returns:
 * - 200 OK if the service is healthy
 * - Includes basic service info
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'healthy',
        service: 'status-pages',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
