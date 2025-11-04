# Status Pages Deployment Guide

## Overview

This document explains the complete deployment process for the BareUptime status pages application.

## Architecture Summary

**Current (Correct) Flow:**
```
User visits: https://example.bareuptime.online
    ↓
Traefik Ingress (Priority 50: *.bareuptime.online)
    ↓
Status Pages Service (port 3000)
    ↓
Next.js App extracts key "example" from subdomain
    ↓
Fetches data: api.bareuptime.co/status/example
    ↓
Backend returns JSON (no auth required)
    ↓
Frontend renders status page
```

## Kubernetes Structure

The status-pages follows the **standard monorepo K8s pattern**:

```
status-pages/k8s/
├── kustomization.yaml    # Orchestrates all resources
└── manifests.yaml        # Consolidated resources (configmap, service, deployment)
```

**Why This Structure?**
- **Consistency:** Matches backend/worker/scheduler patterns
- **Kustomize:** Uses same tooling as other services
- **Consolidation:** Single manifests.yaml reduces file sprawl
- **Namespace Sharing:** Deploys to `bareuptime-backend` namespace

## File Locations

### Application Code
```
/status-pages/
├── src/                  # Next.js source code
├── k8s/                  # Kubernetes manifests
├── Dockerfile            # Multi-stage Docker build
├── package.json          # Node.js dependencies
└── README.md             # Application documentation
```

### Infrastructure
```
/.github/workflows/
└── status-pages-docker-publish.yml    # CI/CD workflow (MONOREPO ROOT)

/k3sinfra/apps/bareuptime-status-page/
└── argocd-application.yaml            # ArgoCD GitOps config

/backend/k8s/
└── ingress.yaml                       # Shared ingress routing
```

**Important:** The workflow is at the **monorepo root** (not in status-pages/.github) because this is a monorepo, not a collection of submodules.

## Shared Ingress Pattern

The ingress configuration lives in `/backend/k8s/ingress.yaml` and serves **multiple services**:

```yaml
# Priority 100: API domains → backend:8080
- Host(`api.bareuptime.co`)

# Priority 50: Wildcard subdomains → status-pages:3000
- Host(`{subdomain:[a-z0-9-]+}.bareuptime.online`)

# Priority 1: Custom domains → backend:8080 (catch-all)
- HostRegexp(`{host:.+}`)
```

**Why Shared?**
1. Single namespace (`bareuptime-backend`) = single ingress entry point
2. Priority-based routing ensures correct service selection
3. Shared TLS certificates (wildcard `*.bareuptime.online`)
4. Middleware reuse (security headers, CORS, rate limits)

This is **correct architecture** for microservices in the same namespace.

## Deployment Process

### 1. Automatic Deployment (Recommended)

**GitHub Actions Workflow** (`.github/workflows/status-pages-docker-publish.yml`):

```yaml
# Triggers
- Push to main branch
- Changes to status-pages/** directory
- Manual workflow_dispatch

# Actions
1. Build Next.js application
2. Create Docker image (multi-stage)
3. Push to ghcr.io/bareuptime/status-pages:latest
4. ArgoCD Image Updater detects new image
5. ArgoCD syncs deployment automatically
```

**Verification:**
```bash
# Check workflow status
gh workflow view "Build and Publish Status Pages Docker Image"

# Check ArgoCD sync status
kubectl get application -n argocd bareuptime-status-page

# Check pods
kubectl get pods -n bareuptime-backend -l app=status-pages
```

### 2. Manual Deployment

#### Step 1: Build and Push Docker Image

```bash
cd status-pages

# Build image
docker build -t ghcr.io/bareuptime/status-pages:latest .

# Login to GHCR
echo $GHCR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Push image
docker push ghcr.io/bareuptime/status-pages:latest
```

#### Step 2: Update Kubernetes

```bash
# Option A: Let ArgoCD sync automatically (recommended)
# Just wait 3 minutes for ArgoCD to detect and sync

# Option B: Trigger ArgoCD sync manually
kubectl apply -f k3sinfra/apps/bareuptime-status-page/argocd-application.yaml
argocd app sync bareuptime-status-page

# Option C: Apply manifests directly (not recommended - bypasses GitOps)
kubectl apply -k status-pages/k8s/
```

### 3. First-Time Setup

**Prerequisites:**
1. Wildcard TLS certificate for `*.bareuptime.online`
2. Cloudflare API token secret
3. GHCR credentials secret
4. ArgoCD installed and configured

**Setup Steps:**

```bash
# 1. Create Cloudflare API token secret (for wildcard cert)
kubectl create secret generic cloudflare-api-token-secret \
  --from-literal=api-token='YOUR_CLOUDFLARE_API_TOKEN' \
  -n bareuptime-backend

# 2. Create wildcard TLS certificate
kubectl apply -f k3sinfra/apps/bareuptime-status-page/wildcard-certificate.yaml

# 3. Wait for certificate to be issued
kubectl get certificate -n bareuptime-backend bareuptime-online-wildcard-tls
# Should show: Ready=True

# 4. Create GHCR credentials secret
kubectl create secret docker-registry ghcr-credentials \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GHCR_TOKEN \
  -n bareuptime-backend

# 5. Apply ArgoCD application
kubectl apply -f k3sinfra/apps/bareuptime-status-page/argocd-application.yaml

# 6. Verify deployment
kubectl get pods -n bareuptime-backend -l app=status-pages
kubectl get svc -n bareuptime-backend status-pages
kubectl get ingressroute -n bareuptime-backend backend-wildcard-subdomains
```

## Configuration

### Environment Variables

**ConfigMap** (`status-pages/k8s/manifests.yaml`):
```yaml
data:
  api-url: "https://api1.bareuptime.co"
  node-env: "production"
```

**To Update:**
```bash
# Edit configmap
kubectl edit configmap status-pages-config -n bareuptime-backend

# Restart pods to pick up changes
kubectl rollout restart deployment/status-pages -n bareuptime-backend
```

### Resource Limits

**Current Settings:**
```yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

**To Adjust:**
Edit `status-pages/k8s/manifests.yaml` and commit changes. ArgoCD will sync automatically.

### Replicas

**Current:** 3 replicas (high availability)

**To Scale:**
```bash
# Temporary (will revert on ArgoCD sync)
kubectl scale deployment/status-pages --replicas=5 -n bareuptime-backend

# Permanent (edit Git, let ArgoCD sync)
# Edit status-pages/k8s/manifests.yaml:
#   spec.replicas: 5
```

## Monitoring

### Health Checks

```bash
# Check pod health
kubectl get pods -n bareuptime-backend -l app=status-pages

# View pod logs
kubectl logs -n bareuptime-backend -l app=status-pages --tail=100 -f

# Check specific pod
kubectl logs -n bareuptime-backend status-pages-xxxx-yyyy

# Describe pod (see events)
kubectl describe pod -n bareuptime-backend status-pages-xxxx-yyyy
```

### Service Status

```bash
# Check service
kubectl get svc -n bareuptime-backend status-pages

# Check endpoints
kubectl get endpoints -n bareuptime-backend status-pages

# Port forward for testing
kubectl port-forward -n bareuptime-backend svc/status-pages 3000:3000
# Visit http://localhost:3000
```

### Ingress Status

```bash
# Check IngressRoute
kubectl get ingressroute -n bareuptime-backend backend-wildcard-subdomains -o yaml

# Check TLS certificate
kubectl get certificate -n bareuptime-backend bareuptime-online-wildcard-tls

# Describe certificate (see events)
kubectl describe certificate -n bareuptime-backend bareuptime-online-wildcard-tls
```

### ArgoCD Status

```bash
# Check application status
kubectl get application -n argocd bareuptime-status-page

# Describe application
kubectl describe application -n argocd bareuptime-status-page

# View sync status
argocd app get bareuptime-status-page

# View last sync
argocd app history bareuptime-status-page
```

## Troubleshooting

### Issue 1: Status Page Returns 404

**Symptoms:**
- `https://example.bareuptime.online` returns 404
- Ingress is configured correctly

**Diagnosis:**
```bash
# Check if pods are running
kubectl get pods -n bareuptime-backend -l app=status-pages

# Check service endpoints
kubectl get endpoints -n bareuptime-backend status-pages

# Check ingress routing
kubectl get ingressroute -n bareuptime-backend backend-wildcard-subdomains -o yaml
```

**Solutions:**
1. Verify pods are running and healthy
2. Check service selector matches pod labels
3. Verify ingress points to correct service:port (status-pages:3000)
4. Test service directly: `kubectl port-forward svc/status-pages 3000:3000`

### Issue 2: TLS Certificate Not Working

**Symptoms:**
- Browser shows "Not Secure" warning
- Certificate invalid or self-signed

**Diagnosis:**
```bash
# Check certificate status
kubectl get certificate -n bareuptime-backend bareuptime-online-wildcard-tls

# Describe certificate
kubectl describe certificate -n bareuptime-backend bareuptime-online-wildcard-tls

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager --tail=100
```

**Solutions:**
1. Verify Cloudflare API token is valid
2. Check DNS is propagated: `dig TXT _acme-challenge.bareuptime.online`
3. Delete and recreate certificate if stuck
4. Verify ClusterIssuer `letsencrypt-prod` exists

### Issue 3: Backend API Connection Failed

**Symptoms:**
- Status page loads but shows "Failed to fetch status"
- Browser console shows network errors

**Diagnosis:**
```bash
# Check ConfigMap API URL
kubectl get configmap -n bareuptime-backend status-pages-config -o yaml

# Test API from pod
kubectl exec -it -n bareuptime-backend status-pages-xxxx-yyyy -- sh
# Inside pod:
# wget -O- https://api1.bareuptime.co/status/example
```

**Solutions:**
1. Verify ConfigMap has correct API URL
2. Check backend service is running: `kubectl get svc -n bareuptime-backend backend`
3. Verify CORS is enabled on backend for `*.bareuptime.online`
4. Check network policies aren't blocking traffic

### Issue 4: ArgoCD Not Syncing

**Symptoms:**
- New commits don't deploy automatically
- ArgoCD shows "OutOfSync" status

**Diagnosis:**
```bash
# Check ArgoCD application
kubectl get application -n argocd bareuptime-status-page

# View sync status
argocd app get bareuptime-status-page

# Check ArgoCD controller logs
kubectl logs -n argocd deployment/argocd-application-controller --tail=100
```

**Solutions:**
1. Verify Git repository URL is correct in ArgoCD application
2. Check repository credentials if private repo
3. Manually sync: `argocd app sync bareuptime-status-page`
4. Check if auto-sync is enabled in application spec

### Issue 5: High Memory Usage

**Symptoms:**
- Pods are OOMKilled
- Status page is slow

**Diagnosis:**
```bash
# Check pod resource usage
kubectl top pods -n bareuptime-backend -l app=status-pages

# Check pod events
kubectl describe pod -n bareuptime-backend status-pages-xxxx-yyyy
```

**Solutions:**
1. Increase memory limits in manifests.yaml
2. Check for memory leaks in application logs
3. Scale horizontally (increase replicas)
4. Optimize Next.js build settings

## Security

### Network Policies

```bash
# Check existing network policies
kubectl get networkpolicy -n bareuptime-backend

# Status pages should allow:
# - Incoming from Traefik (ingress)
# - Outgoing to backend API (api.bareuptime.co)
# - Outgoing to DNS (53/UDP)
```

### Pod Security

The deployment includes:
- Non-root user (UID 1001)
- Read-only root filesystem (disabled for Next.js cache)
- No privilege escalation
- All capabilities dropped

### Secrets Management

```bash
# View secrets (values are base64 encoded)
kubectl get secret -n bareuptime-backend ghcr-credentials

# NEVER commit secrets to Git
# Use sealed-secrets or external-secrets-operator for GitOps
```

## Rollback

### Rollback to Previous Version

```bash
# View deployment history
kubectl rollout history deployment/status-pages -n bareuptime-backend

# Rollback to previous version
kubectl rollout undo deployment/status-pages -n bareuptime-backend

# Rollback to specific revision
kubectl rollout undo deployment/status-pages --to-revision=2 -n bareuptime-backend

# Check rollback status
kubectl rollout status deployment/status-pages -n bareuptime-backend
```

### Rollback Docker Image

```bash
# Update kustomization.yaml to use previous tag
# Edit: status-pages/k8s/kustomization.yaml
images:
  - name: ghcr.io/bareuptime/status-pages
    newTag: <previous-commit-sha>

# Commit and push - ArgoCD will sync
```

## Performance Optimization

### Horizontal Pod Autoscaling

```yaml
# Create HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: status-pages
  namespace: bareuptime-backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: status-pages
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### CDN/Caching

Consider adding:
- CloudFlare caching for static assets
- Redis cache for API responses
- Next.js ISR (Incremental Static Regeneration)

## Maintenance

### Update Dependencies

```bash
cd status-pages

# Check for updates
npm outdated

# Update packages
npm update

# Update major versions
npm install next@latest react@latest

# Test locally
npm run dev

# Commit and push - workflow will build new image
```

### Update Kubernetes Resources

```bash
# Edit manifests
vim status-pages/k8s/manifests.yaml

# Validate with kustomize
kubectl kustomize status-pages/k8s/

# Commit and push - ArgoCD will sync
git add status-pages/k8s/
git commit -m "Update status-pages resources"
git push origin main
```

## Contact

For issues or questions:
- **Infrastructure:** Check #infra Slack channel
- **Application Bugs:** File GitHub issue in monorepo
- **Security Issues:** Contact security team directly
