# ShipMate - Project Memory

## Deployment
- **Always deploy from project root** (`C:\Users\Oren\Projects\Dropship GCP`)
- **No WSL/bash on this machine** — use cmd commands directly, not .sh scripts
- **Deploy command** (one-liner for cmd):
  ```cmd
  git add -A && git commit -m "your message" && git push origin master && gcloud builds submit --config=cloudbuild.yaml --region=me-west1 --project=dropship-488214 .
  ```
- GCP account: `oren@skil.media`
- `gcloud auth login` has issues (possibly Firefox default browser). Use `gcloud auth login --no-launch-browser` instead — it gives a URL to copy-paste.
- GCP auth tokens expire periodically. When deploy fails with "Reauthentication failed", re-run `gcloud auth login --no-launch-browser`.

## Project
- Next.js 14 + TypeScript + Firestore + Cloud Run
- Region: me-west1 (Tel Aviv)
- Project ID: dropship-488214
- Domain: shipmate.store
- RTL Hebrew UI

## Task 6 (Pending)
- WhatsApp link on contact page needs a phone number — user said "we'll add later"

## Email (Task 7)
- support@shipmate.store has no MX records — can send via Resend but cannot receive
- Needs Cloudflare Email Routing or similar to receive mail
