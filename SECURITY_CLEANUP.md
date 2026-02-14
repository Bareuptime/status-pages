# Security Cleanup Instructions

## 1. Remove Existing Contaminated Images
```bash
# Remove all existing status-pages images
docker rmi ghcr.io/bareuptime/status-pages:latest --force
docker rmi ghcr.io/bareuptime/status-pages:staged --force
docker system prune -a --volumes --force
```

## 2. Rebuild with Updated Dockerfile
```bash
# Build with no cache to ensure clean build
docker build --no-cache -t ghcr.io/bareuptime/status-pages:latest .
```

## 3. Scan the New Image for Vulnerabilities
```bash
# Install Trivy if not already installed
# brew install aquasecurity/trivy/trivy  # macOS
# Or download from https://github.com/aquasecurity/trivy/releases

# Scan the new image
trivy image ghcr.io/bareuptime/status-pages:latest
```

## 4. Check Running Containers for rbot Process
```bash
# List all running containers
docker ps

# Check for suspicious processes in running containers
docker exec <container-id> ps aux | grep -i rbot

# If found, stop and remove immediately
docker stop <container-id>
docker rm <container-id>
```

## 5. Redeploy via GitHub Actions
Push the updated Dockerfile to trigger the CI/CD pipeline:
```bash
git add Dockerfile
git commit -m "fix(security): Pin Node.js version and add security hardening to prevent rbot injection"
git push origin main
```

## 6. Monitor Kubernetes Pods
```bash
# Watch for pod restarts
kubectl get pods -n bareuptime-backend -w

# Check logs for suspicious activity
kubectl logs -n bareuptime-backend -l app=status-pages --tail=100

# Exec into pod to check for rbot
kubectl exec -n bareuptime-backend -it deployment/status-pages -- ps aux | grep -i rbot
```

## Prevention Going Forward
- Never use floating tags like `:latest` or `:22-alpine`
- Always pin to specific digests
- Regularly scan images with Trivy or Snyk
- Monitor container processes for anomalies
