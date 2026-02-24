# One-time setup: Create a service account key for Claude Code to use
# This lets the AI assistant run gcloud commands without interactive browser auth
$project = "dropship-488214"
$saName = "claude-deployer"
$saEmail = "$saName@$project.iam.gserviceaccount.com"
$keyPath = "$HOME\.config\gcloud\claude-deployer-key.json"

Write-Host "Creating service account '$saName'..." -ForegroundColor Cyan
gcloud iam service-accounts create $saName --display-name="Claude Code Deployer" --project=$project 2>$null

Write-Host "Granting permissions..." -ForegroundColor Cyan
# Cloud Run admin (deploy)
gcloud projects add-iam-policy-binding $project --member="serviceAccount:$saEmail" --role="roles/run.admin" --quiet 2>$null
# Cloud Build editor (trigger builds)
gcloud projects add-iam-policy-binding $project --member="serviceAccount:$saEmail" --role="roles/cloudbuild.builds.editor" --quiet 2>$null
# Secret Manager accessor (read secrets)
gcloud projects add-iam-policy-binding $project --member="serviceAccount:$saEmail" --role="roles/secretmanager.secretAccessor" --quiet 2>$null
# Service account user (deploy to Cloud Run)
gcloud projects add-iam-policy-binding $project --member="serviceAccount:$saEmail" --role="roles/iam.serviceAccountUser" --quiet 2>$null
# Logs viewer
gcloud projects add-iam-policy-binding $project --member="serviceAccount:$saEmail" --role="roles/logging.viewer" --quiet 2>$null

Write-Host "Creating key file at $keyPath..." -ForegroundColor Cyan
gcloud iam service-accounts keys create $keyPath --iam-account=$saEmail --project=$project

Write-Host "`nDone! Key saved to: $keyPath" -ForegroundColor Green
Write-Host "Claude Code can now run: gcloud auth activate-service-account --key-file=$keyPath" -ForegroundColor Yellow
