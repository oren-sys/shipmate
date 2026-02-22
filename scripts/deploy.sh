#!/usr/bin/env bash
# ============================================
# ShipMate Full Deployment Script
# ============================================
# Orchestrates: Docker → Cloud Run → Functions → Scheduler
#
# Usage:
#   bash scripts/deploy.sh              # Full deploy
#   bash scripts/deploy.sh --app-only   # Only app (Cloud Run)
#   bash scripts/deploy.sh --fn-only    # Only Cloud Functions
# ============================================

set -euo pipefail

PROJECT_ID="dropship-488214"
REGION="me-west1"
SERVICE_NAME="shipmate"
REPO_NAME="shipmate"
IMAGE="me-west1-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}"
TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[ShipMate]${NC} $1"; }
success() { echo -e "${GREEN}[✅]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠️]${NC} $1"; }
error() { echo -e "${RED}[❌]${NC} $1"; exit 1; }

# ---- Parse arguments ----
DEPLOY_APP=true
DEPLOY_FN=true

if [[ "${1:-}" == "--app-only" ]]; then
  DEPLOY_FN=false
elif [[ "${1:-}" == "--fn-only" ]]; then
  DEPLOY_APP=false
fi

# ---- Pre-flight checks ----
log "Starting deployment..."
log "Project: ${PROJECT_ID}"
log "Region: ${REGION}"
log "Tag: ${TAG}"

# Verify gcloud is configured
gcloud config set project ${PROJECT_ID} 2>/dev/null
log "GCP project set to ${PROJECT_ID}"

# ---- Step 1: Ensure Artifact Registry repo exists ----
if [[ "${DEPLOY_APP}" == true ]]; then
  log "Checking Artifact Registry..."
  gcloud artifacts repositories describe ${REPO_NAME} \
    --location=${REGION} \
    --project=${PROJECT_ID} 2>/dev/null || \
  gcloud artifacts repositories create ${REPO_NAME} \
    --repository-format=docker \
    --location=${REGION} \
    --description="ShipMate Docker images" \
    --project=${PROJECT_ID}
  success "Artifact Registry ready"

  # ---- Step 2: Build Docker image ----
  log "Building Docker image..."
  docker build \
    -t "${IMAGE}:${TAG}" \
    -t "${IMAGE}:latest" \
    .
  success "Docker image built"

  # ---- Step 3: Push to Artifact Registry ----
  log "Pushing to Artifact Registry..."
  gcloud auth configure-docker me-west1-docker.pkg.dev --quiet
  docker push "${IMAGE}:${TAG}"
  docker push "${IMAGE}:latest"
  success "Image pushed"

  # ---- Step 4: Deploy to Cloud Run ----
  log "Deploying to Cloud Run..."
  gcloud run deploy ${SERVICE_NAME} \
    --image "${IMAGE}:${TAG}" \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --concurrency 80 \
    --timeout 300 \
    --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_BASE_URL=https://shipmate.store,NEXT_PUBLIC_GA4_ID=G-6YQSMHJEKP,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GCS_PRODUCTS_BUCKET=${PROJECT_ID}-products,GCS_INVOICES_BUCKET=${PROJECT_ID}-invoices" \
    --set-secrets "NEXTAUTH_SECRET=nextauth-secret:latest,MESHULAM_API_KEY=meshulam-api-key:latest,MESHULAM_PAGE_CODE=meshulam-page-code:latest,WHATSAPP_API_TOKEN=whatsapp-api-token:latest,WHATSAPP_PHONE_ID=whatsapp-phone-id:latest,ALIEXPRESS_APP_KEY=aliexpress-app-key:latest,ALIEXPRESS_APP_SECRET=aliexpress-app-secret:latest,ADMIN_EMAIL=admin-email:latest,ADMIN_PASSWORD=admin-password:latest"
  success "Cloud Run deployed"

  # Get the service URL
  SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format="value(status.url)")
  log "Service URL: ${SERVICE_URL}"
fi

# ---- Step 5: Deploy Cloud Functions ----
if [[ "${DEPLOY_FN}" == true ]]; then
  log "Deploying Cloud Functions..."

  # Meta CAPI
  log "Deploying meta-capi..."
  cd functions/meta-capi
  npm install --production 2>/dev/null || true
  npx tsc 2>/dev/null || true
  gcloud functions deploy meta-capi \
    --gen2 \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --region ${REGION} \
    --memory 256MB \
    --timeout 30s \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
    --set-secrets "META_PIXEL_ID=meta-pixel-id:latest,META_ACCESS_TOKEN=meta-access-token:latest" \
    --source . 2>/dev/null && success "meta-capi deployed" || warn "meta-capi deploy failed (secrets may not exist yet)"
  cd ../..

  # Cart Recovery
  log "Deploying cart-recovery..."
  cd functions/cart-recovery
  npm install --production 2>/dev/null || true
  npx tsc 2>/dev/null || true
  gcloud functions deploy cart-recovery \
    --gen2 \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --region ${REGION} \
    --memory 256MB \
    --timeout 60s \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},BASE_URL=https://shipmate.store" \
    --set-secrets "WHATSAPP_API_TOKEN=whatsapp-api-token:latest,WHATSAPP_PHONE_ID=whatsapp-phone-id:latest" \
    --source . 2>/dev/null && success "cart-recovery deployed" || warn "cart-recovery deploy failed"
  cd ../..

  # Scheduler Dispatcher
  log "Deploying scheduler-dispatcher..."
  cd functions/scheduler-dispatcher
  npm install --production 2>/dev/null || true
  npx tsc 2>/dev/null || true
  gcloud functions deploy scheduler-dispatcher \
    --gen2 \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --region ${REGION} \
    --memory 256MB \
    --timeout 120s \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},BASE_URL=https://shipmate.store" \
    --source . 2>/dev/null && success "scheduler-dispatcher deployed" || warn "scheduler-dispatcher deploy failed"
  cd ../..

  # Daily Summary
  log "Deploying daily-summary..."
  cd functions/daily-summary
  npm install --production 2>/dev/null || true
  npx tsc 2>/dev/null || true
  gcloud functions deploy daily-summary \
    --gen2 \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --region ${REGION} \
    --memory 256MB \
    --timeout 60s \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID},BASE_URL=https://shipmate.store" \
    --set-secrets "ADMIN_EMAIL=admin-email:latest" \
    --source . 2>/dev/null && success "daily-summary deployed" || warn "daily-summary deploy failed"
  cd ../..

  success "Cloud Functions deployment complete"
fi

# ---- Step 6: Setup Cloud Scheduler ----
if [[ "${DEPLOY_FN}" == true ]]; then
  log "Setting up Cloud Scheduler..."

  DISPATCHER_URL=$(gcloud functions describe scheduler-dispatcher --region ${REGION} --gen2 --format="value(serviceConfig.uri)" 2>/dev/null || echo "")

  if [[ -n "${DISPATCHER_URL}" ]]; then
    # Create or update scheduler job (every 30 minutes)
    gcloud scheduler jobs describe shipmate-scheduler \
      --location ${REGION} 2>/dev/null && \
    gcloud scheduler jobs update http shipmate-scheduler \
      --location ${REGION} \
      --schedule "*/30 * * * *" \
      --uri "${DISPATCHER_URL}" \
      --http-method POST \
      --time-zone "Asia/Jerusalem" \
      --attempt-deadline 120s 2>/dev/null || \
    gcloud scheduler jobs create http shipmate-scheduler \
      --location ${REGION} \
      --schedule "*/30 * * * *" \
      --uri "${DISPATCHER_URL}" \
      --http-method POST \
      --time-zone "Asia/Jerusalem" \
      --attempt-deadline 120s 2>/dev/null

    success "Cloud Scheduler configured (every 30 min)"
  else
    warn "Scheduler dispatcher URL not found, skipping scheduler setup"
  fi
fi

# ---- Done ----
echo ""
echo "============================================"
success "ShipMate deployment complete! 🚀"
echo "============================================"

if [[ "${DEPLOY_APP}" == true ]]; then
  echo -e "  App: ${GREEN}${SERVICE_URL:-https://shipmate.store}${NC}"
fi
echo -e "  Project: ${PROJECT_ID}"
echo -e "  Region: ${REGION}"
echo ""
echo "Next steps:"
echo "  1. Run seed data:     npx tsx scripts/seed.ts"
echo "  2. Validate:          npx tsx scripts/pre-launch-check.ts"
echo "  3. Map domain:        gcloud run domain-mappings create --service shipmate --domain shipmate.store --region ${REGION}"
echo ""
