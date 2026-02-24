# ShipMate - Project Memory

## Deployment
- **Always deploy from project root** (`C:\Users\Oren\Projects\Dropship GCP`)
- **No WSL/bash on this machine** — use cmd commands directly, not .sh scripts
- **GitHub trigger auto-deploys on push to master** — no `gcloud builds submit` needed!
- **Deploy command** (one-liner for cmd):
  ```cmd
  git add -A && git commit -m "your message" && git push origin master
  ```
- If no code changes but need to trigger deploy: `git commit --allow-empty -m "trigger deploy" && git push origin master`
- GCP account: `oren@skil.media`
- `gcloud auth login` has persistent issues from Claude's non-interactive terminal. For Firestore scripts, use `gcloud auth application-default login` from user's own terminal.
- Cloud Build trigger name: `deploy-on-push` (region: me-west1)

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
