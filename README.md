# chris-project

## Google Geocoding API POC

This repo includes a small Node.js script for testing Google Geocoding API without committing an API key.

Run it with:

```bash
GOOGLE_MAPS_API_KEY='<your-key>' node scripts/test-geocode.mjs 台北101
```

Expected successful output includes:

```json
{
  "httpStatus": 200,
  "googleStatus": "OK",
  "errorMessage": null,
  "firstResult": {
    "formattedAddress": "...",
    "location": {
      "lat": 25.0339639,
      "lng": 121.5644722
    },
    "placeId": "..."
  }
}
```

If the output says `API keys with referer restrictions cannot be used with this API`, the key's application restriction is not compatible with the Geocoding API web service. For this server-side style request, use either no application restriction for a temporary POC, or IP address restriction for a backend service.
