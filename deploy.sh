#!/usr/bin/env bash
# ─── Darwin — One-Shot Cloud Run Deploy Script ────────────────────────────────
# Usage: ./deploy.sh
#
# What it does:
#   1. Builds backend + frontend Docker images via Cloud Build
#   2. Pushes to Artifact Registry (asia-south1)
#   3. Deploys darwin-backend Cloud Run service
#   4. Deploys darwin (frontend) Cloud Run service
#   5. Prints live URLs
#
# Requirements: gcloud CLI, authenticated as balarajr483@gmail.com
# Project: darwinagent | Region: asia-south1
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT="darwinagent"
REGION="asia-south1"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT}/darwin-repo"
SA="darwin-backend-sa@${PROJECT}.iam.gserviceaccount.com"

BACKEND_IMAGE="${REGISTRY}/darwin-backend:latest"
FRONTEND_IMAGE="${REGISTRY}/darwin-frontend:latest"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Darwin — Deploying to Google Cloud Run"
echo "  Project: ${PROJECT} | Region: ${REGION}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Build backend ─────────────────────────────────────────────────────
echo ""
echo "📦 Building backend image..."
gcloud builds submit ./backend \
  --tag="${BACKEND_IMAGE}" \
  --project="${PROJECT}" \
  --region="${REGION}" \
  --timeout=600

echo "✓ Backend image: ${BACKEND_IMAGE}"

# ── Step 2: Deploy backend Cloud Run ─────────────────────────────────────────
echo ""
echo "🚀 Deploying darwin-backend to Cloud Run..."
gcloud run deploy darwin-backend \
  --image="${BACKEND_IMAGE}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --service-account="${SA}" \
  --allow-unauthenticated \
  --port=8000 \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=300 \
  --set-env-vars="^|^GCP_PROJECT=${PROJECT}|GCP_LOCATION=${REGION}|ENVIRONMENT=production|FIREBASE_PROJECT_ID=${PROJECT}|ALLOWED_ORIGINS_STR=https://darwin-PROJECT_NUMBER.${REGION}.run.app,http://localhost:3000" \
  --set-secrets="OPENROUTER_API_KEY=darwin-openrouter-key:latest,OPENROUTER_API_KEY_SECONDARY=darwin-openrouter-key-secondary:latest,NVIDIA_API_KEY=darwin-nvidia-key:latest,NVIDIA_API_KEY_SECONDARY=darwin-nvidia-key-secondary:latest" \
  --quiet

# Get backend URL
BACKEND_URL=$(gcloud run services describe darwin-backend \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --format="value(status.url)")
echo "✓ Backend live at: ${BACKEND_URL}"

# ── Step 4: Build frontend image (with backend URL baked in) ─────────────────
echo ""
echo "📦 Building frontend image..."
echo "NEXT_PUBLIC_API_URL=${BACKEND_URL}" > ./frontend/.env.production
gcloud builds submit ./frontend \
  --tag="${FRONTEND_IMAGE}" \
  --project="${PROJECT}" \
  --region="${REGION}" \
  --timeout=600

echo "✓ Frontend image: ${FRONTEND_IMAGE}"

# ── Step 5: Deploy frontend Cloud Run (service named "darwin") ───────────────
echo ""
echo "🚀 Deploying darwin (frontend) to Cloud Run..."
gcloud run deploy darwin \
  --image="${FRONTEND_IMAGE}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --allow-unauthenticated \
  --port=3000 \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=60 \
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_URL=${BACKEND_URL}" \
  --quiet

FRONTEND_URL=$(gcloud run services describe darwin \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --format="value(status.url)")
echo "✓ Frontend live at: ${FRONTEND_URL}"

# ── Step 6: Final CORS patch with exact frontend URL ─────────────────────────
gcloud run services update darwin-backend \
  --region="${REGION}" \
  --project="${PROJECT}" \
  --set-env-vars="^|^GCP_PROJECT=${PROJECT}|GCP_LOCATION=${REGION}|ENVIRONMENT=production|FIREBASE_PROJECT_ID=${PROJECT}|ALLOWED_ORIGINS_STR=${FRONTEND_URL},http://localhost:3000,http://localhost:3001" \
  --quiet

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Darwin deployed successfully!"
echo ""
echo "  🌐 App (Frontend):   ${FRONTEND_URL}"
echo "  🔌 API (Backend):    ${BACKEND_URL}"
echo "  📖 API Docs:         ${BACKEND_URL}/docs"
echo "  🏥 Health Check:     ${BACKEND_URL}/health"
echo ""
echo "  🤖 Vertex AI agents running on: ${PROJECT} / ${REGION}"
echo "  📊 Cloud Logging:    https://console.cloud.google.com/logs?project=${PROJECT}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
