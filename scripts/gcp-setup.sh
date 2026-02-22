#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="dropship-488214"
REGION="me-west1"

echo "=== Setting GCP project ==="
gcloud config set project $PROJECT_ID

echo "=== Enabling APIs ==="
gcloud services enable \
  run.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudtasks.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  translate.googleapis.com \
  artifactregistry.googleapis.com \
  logging.googleapis.com \
  clouderrorreporting.googleapis.com \
  iam.googleapis.com

echo "=== Creating Firestore database ==="
gcloud firestore databases create \
  --location=$REGION \
  --type=firestore-native \
  2>/dev/null || echo "Firestore already exists"

echo "=== Creating Cloud Storage buckets ==="
gsutil mb -l $REGION -p $PROJECT_ID gs://${PROJECT_ID}-products/ 2>/dev/null || echo "Products bucket exists"
gsutil mb -l $REGION -p $PROJECT_ID gs://${PROJECT_ID}-invoices/ 2>/dev/null || echo "Invoices bucket exists"
gsutil mb -l $REGION -p $PROJECT_ID gs://${PROJECT_ID}-assets/ 2>/dev/null || echo "Assets bucket exists"

# Make products and assets buckets public
gsutil iam ch allUsers:objectViewer gs://${PROJECT_ID}-products/
gsutil iam ch allUsers:objectViewer gs://${PROJECT_ID}-assets/

echo "=== Creating Cloud Tasks queue ==="
gcloud tasks queues create order-processing \
  --location=$REGION \
  2>/dev/null || echo "Queue exists"

gcloud tasks queues create image-processing \
  --location=$REGION \
  2>/dev/null || echo "Queue exists"

gcloud tasks queues create notifications \
  --location=$REGION \
  2>/dev/null || echo "Queue exists"

echo "=== Creating Artifact Registry repo ==="
gcloud artifacts repositories create shipmate \
  --repository-format=docker \
  --location=$REGION \
  --description="ShipMate Docker images" \
  2>/dev/null || echo "Repo exists"

echo "=== Setting up Secret Manager secrets ==="
SECRETS=(
  "MESHULAM_API_KEY"
  "MESHULAM_PAGE_CODE"
  "ALIEXPRESS_API_KEY"
  "ALIEXPRESS_API_SECRET"
  "WHATSAPP_API_TOKEN"
  "WHATSAPP_PHONE_ID"
  "META_PIXEL_ID"
  "TIKTOK_PIXEL_ID"
  "GOOGLE_ANALYTICS_ID"
  "NEXTAUTH_SECRET"
  "ADMIN_EMAIL"
  "ADMIN_PASSWORD"
  "GMAIL_CLIENT_ID"
  "GMAIL_CLIENT_SECRET"
  "GMAIL_REFRESH_TOKEN"
)

for SECRET in "${SECRETS[@]}"; do
  echo "placeholder" | gcloud secrets create $SECRET \
    --data-file=- \
    --replication-policy=automatic \
    2>/dev/null || echo "Secret $SECRET exists"
done

echo "=== Creating service account ==="
SA_NAME="shipmate-runner"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create $SA_NAME \
  --display-name="ShipMate Cloud Run" \
  2>/dev/null || echo "SA exists"

# Grant permissions
ROLES=(
  "roles/datastore.user"
  "roles/storage.objectAdmin"
  "roles/cloudtasks.enqueuer"
  "roles/secretmanager.secretAccessor"
  "roles/logging.logWriter"
  "roles/errorreporting.writer"
  "roles/run.invoker"
)

for ROLE in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$ROLE" \
    --quiet
done

echo ""
echo "=== Setup Complete ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Account: $SA_EMAIL"
echo "Buckets: gs://${PROJECT_ID}-products/ gs://${PROJECT_ID}-invoices/ gs://${PROJECT_ID}-assets/"
echo "Task Queues: order-processing, image-processing, notifications"
echo ""
echo "Next: Run 'npm install' in the project directory"
