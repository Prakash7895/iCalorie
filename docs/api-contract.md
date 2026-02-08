# API Contract (MVP)

## POST /scan
- Request: multipart form-data with `image` file
- Response:
```json
{
  "items": [
    {
      "name": "Grilled chicken",
      "grams": 160,
      "calories": 220,
      "protein_g": 32,
      "carbs_g": 0,
      "fat_g": 9,
      "confidence": 0.82
    }
  ],
  "total_calories": 620,
  "photo_url": "s3://icalorie/..."
}
```

## POST /scan/confirm
- Request: JSON payload with edited `items[]` and `photo_url`
- Response: same as `/scan` (recomputed totals)

## POST /scan/log
- Request: JSON payload with meal info
- Response: `{ "status": "ok" }`

## GET /health
- Response: `{ "status": "ok" }`
