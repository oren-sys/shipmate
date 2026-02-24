# Fix AliExpress secrets (one-time)
$project = "dropship-488214"

# Write correct values without -n prefix
[System.IO.File]::WriteAllText("$env:TEMP\ae-key.txt", "528274")
[System.IO.File]::WriteAllText("$env:TEMP\ae-secret.txt", "ahcuwdayo1XfVpWSqEWBJvS3bp1bEdSY")

Write-Host "Updating aliexpress-app-key..." -ForegroundColor Cyan
gcloud secrets versions add aliexpress-app-key --data-file="$env:TEMP\ae-key.txt" --project=$project

Write-Host "Updating aliexpress-app-secret..." -ForegroundColor Cyan
gcloud secrets versions add aliexpress-app-secret --data-file="$env:TEMP\ae-secret.txt" --project=$project

# Clean up
Remove-Item "$env:TEMP\ae-key.txt", "$env:TEMP\ae-secret.txt" -ErrorAction SilentlyContinue

Write-Host "`nDone! Secrets updated." -ForegroundColor Green
Write-Host "Cloud Run will pick up the new values on next deploy." -ForegroundColor Yellow
