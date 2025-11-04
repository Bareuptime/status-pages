import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function StatusPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="text-center text-sm text-muted-foreground">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        Loading status page…
      </div>
    </div>
  )
}

interface StatusPageErrorProps {
  error: string
  onRetry?: () => void
}

export function StatusPageError({ error, onRetry }: StatusPageErrorProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="mx-auto max-w-md space-y-6 rounded-lg border border-destructive/20 bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Status page not found</h2>
          <p className="text-sm text-muted-foreground">
            {error || "The status page you're looking for doesn't exist or is not publicly accessible."}
          </p>
        </div>
        <Button onClick={handleRetry} variant="outline">Try again</Button>
      </div>
    </div>
  )
}
