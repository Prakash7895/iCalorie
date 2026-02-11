# iCalorie Backend Setup

## Environment Variables

The following environment variables are required in `apps/api/.env`:

```bash
OPENAI_API_KEY=sk-...
USDA_API_KEY=... # Get from https://fdc.nal.usda.gov/api-key-signup.html
```

## Install Dependencies

```bash
cd apps/api
pip install -r requirements.txt
```

## Run Server

```bash
uvicorn app.main:app --reload
```
