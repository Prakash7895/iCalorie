# iCalorie

Monorepo for the iCalorie mobile app (React Native Expo) and API (FastAPI).

## Structure
- `apps/mobile` — Expo app (placeholder scaffold)
- `apps/api` — FastAPI service
- `infra` — local dev infrastructure (Postgres, MinIO)
- `docs` — API contract and architecture notes

## Quick start (local)
1. Bring up infra
   - `docker compose -f /Users/prakashchoudhary/Documents/New project/iCalorie/infra/docker-compose.yml up -d`
2. Start API
   - `cd /Users/prakashchoudhary/Documents/New project/iCalorie/apps/api`
   - `python3 -m venv .venv && source .venv/bin/activate`
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app --reload`
3. Start mobile (placeholder)
   - `cd /Users/prakashchoudhary/Documents/New project/iCalorie/apps/mobile`
   - `npx expo start`

Notes:
- S3-compatible storage is provided by MinIO locally. Set `S3_ENDPOINT_URL` to the MinIO URL.
- The mobile app will call the API at `API_BASE_URL`.
