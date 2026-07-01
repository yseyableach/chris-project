# chris-project

租賃車接送試算網站。前端是靜態 HTML，Google 地點搜尋與開車距離試算都走 Netlify Functions，Google Maps API key 不會出現在前端 HTML、瀏覽器儲存空間或 GitHub repo。

## Local development

Use a server-side Google Maps key:

- Application restrictions: none
- API restrictions: Places API, Routes API
- Billing enabled

Run the local Netlify-style server:

```bash
GOOGLE_MAPS_API_KEY='<server-key>' node scripts/dev-server.mjs
```

Open:

```text
http://127.0.0.1:8080/google.html
```

Do not open `google.html` through `file://`; API routes only work through the local server.

## Netlify deploy

Set this environment variable in Netlify:

```text
GOOGLE_MAPS_API_KEY=<server-key>
```

Netlify settings:

```text
Build command: empty
Publish directory: .
Functions directory: netlify/functions
```

`netlify.toml` already configures the function routes:

- `/api/places/search`
- `/api/quote`

## API flow

1. The browser calls `/api/places/search` with the user's typed location.
2. The function calls Google Places API and returns candidates.
3. The user selects one candidate.
4. The browser calls `/api/quote`.
5. The function calls Google Routes API, calculates pricing, and returns the quote.

The frontend never receives the Google API key.
