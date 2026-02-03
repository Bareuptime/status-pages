# BareUptime Status Pages

Public-facing status page application for BareUptime monitoring service. This Next.js application displays uptime statistics and monitor statuses for public status pages accessible via `*.bareuptime.online` subdomains.

## Architecture

- **Framework**: Next.js 15.2.4 with App Router
- **Runtime**: React 19 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Docker + Kubernetes (K3s) + ArgoCD GitOps

## Key Features

- **Public Access**: No authentication required
- **Real-time Data**: Fetches from `api.bareuptime.co/status/{key}` API
- **Auto-refresh**: Updates every 60 seconds
- **Responsive Design**: Mobile-friendly with Vercel-inspired theme
- **Multi-region Stats**: Historical uptime data by geographic region
- **Subdomain Routing**: Extracts status page key from subdomain

## Project Structure

```
status-pages/
├── src/
│   ├── app/
│   │   ├── [key]/page.tsx      # Dynamic route for status pages
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles with theme
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   └── status-page/         # Status page components
│   └── lib/
│       ├── api.ts               # API client
│       ├── types.ts             # TypeScript types
│       ├── status-page-utils.ts # Utility functions
│       └── utils.ts             # cn() helper
├── k8s/
│   ├── deployment.yaml          # Kubernetes deployment
│   ├── service.yaml             # Kubernetes service
│   └── configmap.yaml           # Environment configuration
├── Dockerfile                   # Multi-stage Docker build
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind configuration
└── package.json                 # Dependencies
```

## Development

### Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

The application will be available at `http://localhost:3000`.

### Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `https://api1.bareuptime.co`)

## Docker Build

### Build Image

```bash
# Build with latest tag
docker build -t ghcr.io/bareuptime/status-pages:latest .

# Build with specific tag (e.g., staged)
docker build -t ghcr.io/bareuptime/status-pages:staged .
```

### Run Locally

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api1.bareuptime.co \
  ghcr.io/bareuptime/status-pages:latest
```

## Kubernetes Deployment

### Deploy to K3s

The application is deployed using GitOps with ArgoCD:

1. **Update ArgoCD Application** (`/k3sinfra/apps/bareuptime-status-page/argocd-application.yaml`):
   ```yaml
   source:
     repoURL: https://github.com/YOUR_ORG/main-app.git
     targetRevision: main
     path: status-pages/k8s
   ```

2. **Apply ArgoCD Application**:
   ```bash
   kubectl apply -f k3sinfra/apps/bareuptime-status-page/argocd-application.yaml
   ```

3. **ArgoCD will automatically**:
   - Create namespace `bareuptime-backend` (if not exists)
   - Deploy 3 replicas of the status-pages pod
   - Create ClusterIP service on port 3000
   - Apply ConfigMap with API URL

### Ingress Configuration

The ingress routes `*.bareuptime.online` to the status-pages service:

```yaml
# In backend/k8s/ingress.yaml
- match: Host(`{subdomain:[a-z0-9-]+}.bareuptime.online`)
  services:
    - name: status-pages
      port: 3000
```

**Important**: Custom domains continue routing to the backend service for custom domain functionality.

## How It Works

1. **User visits**: `https://example.bareuptime.online`
2. **Traefik ingress** routes to status-pages service
3. **Next.js app** extracts key `example` from subdomain
4. **API call** to `api.bareuptime.co/status/example`
5. **Backend returns** JSON with monitors and statistics
6. **Frontend renders** status page with:
   - Overall system status
   - Statistics cards (total monitors, online, offline, uptime%)
   - Individual monitor cards with historical data
   - Uptime visualization by region
   - Auto-refresh every 60 seconds

## Monitoring & Health

- **Liveness Probe**: `GET /` on port 3000
- **Readiness Probe**: `GET /` on port 3000
- **Metrics**: Next.js built-in telemetry (disabled in production)

## Resource Usage

- **Requests**: 256Mi RAM, 100m CPU
- **Limits**: 512Mi RAM, 500m CPU
- **Replicas**: 3 (high availability)

## Security

- Runs as non-root user (UID 1001)
- No privilege escalation
- Drops all Linux capabilities
- TLS enabled via wildcard certificate
- Uses an init reaper (tini) in the container to prevent zombie processes (e.g., `[rbot]` entries when a child exits and PID 1 does not reap it)

### Unexpected processes in pods

If you see a process like `[rbot]` in `ps` output, it means a short-lived child process exited but was not reaped by PID 1. The status-pages code does not spawn `rbot`; this typically happens when:

- A user or automation ran a command via `kubectl exec` inside the pod
- A compromised container image or dependency launched a helper process
- PID 1 was not acting as an init process (fixed by the tini entrypoint)

First check audit logs for exec access; if you find unauthorized access, rotate credentials, then redeploy with the updated image to ensure zombies are reaped.

## Troubleshooting

### Status page not loading

```bash
# Check pod status
kubectl get pods -n bareuptime-backend -l app=status-pages

# View logs
kubectl logs -n bareuptime-backend -l app=status-pages --tail=100

# Check service
kubectl get svc -n bareuptime-backend status-pages
```

### API connection issues

Verify the ConfigMap has the correct API URL:

```bash
kubectl get configmap -n bareuptime-backend status-pages-config -o yaml
```

### Ingress not routing

Check the IngressRoute:

```bash
kubectl get ingressroute -n bareuptime-backend backend-wildcard-subdomains -o yaml
```

## CI/CD Pipeline

**Workflow Location:** `/.github/workflows/status-pages-docker-publish.yml` (monorepo root)

**Pipeline Steps:**
1. **Trigger:** Push to main branch or changes to `status-pages/**`
2. **Build:** GitHub Actions builds Next.js app and Docker image
3. **Push:** To `ghcr.io/bareuptime/status-pages:latest` and `:staged`
4. **Deploy:** ArgoCD Image Updater detects new image
5. **Sync:** ArgoCD auto-deploys to K3s cluster (bareuptime-backend namespace)

## Contributing

When making changes:

1. Test locally with `npm run dev`
2. Build Docker image: `docker build -t status-pages:test .`
3. Test in K8s: Update deployment image to `:test` tag
4. Verify functionality on test subdomain
5. Merge to main for production deployment

## License

Proprietary - BareUptime
