# chris-project

車旅所接送車資試算網站。前端是靜態 HTML，Google 地點搜尋與開車距離試算都走 Netlify Functions，Google Maps API key 不會出現在前端、瀏覽器儲存空間或 GitHub repo。

## 一句話版本

使用者輸入出發地，網站先讓使用者選 Google 候選地點，再由後端用 Google Routes 算開車距離和車資。

```text
Browser
  -> /api/places/search
  -> /api/quote
Netlify Functions
  -> Google Places API
  -> Google Routes API
```

## 重要安全原則

- Google key 只放在 Netlify Environment Variables。
- 不要把 key 寫進 `index.html`、`google.html` 或任何前端 JS。
- 不要把 key commit 到 GitHub。
- 不要讓前端直接呼叫 Google Maps API。
- 前端送來的價格不可信，正式價格必須由後端重新計算。

目前使用的 env key：

```text
GOOGLE_MAPS_API_KEY
```

## 主要檔案

```text
index.html
  OSM / Nominatim POC 版。

google.html
  Google 後端版 UI。前端只呼叫自己的 /api，不碰 Google key。

netlify/functions/places-search.mjs
  POST /api/places/search
  使用 Google Places API 搜尋候選地點。

netlify/functions/quote.mjs
  POST /api/quote
  使用 Google Routes API 計算開車距離，再計算車資。

netlify.toml
  設定 Netlify publish directory、functions directory、API redirects。

scripts/dev-server.mjs
  本機模擬 Netlify Functions，方便 local 測試完整流程。
```

## Local 測試

需要一把 server-side Google Maps key：

- Application restrictions: none
- API restrictions: Places API, Routes API
- Billing enabled

啟動本機 server：

```bash
GOOGLE_MAPS_API_KEY='<server-key>' node scripts/dev-server.mjs
```

打開：

```text
http://127.0.0.1:8080/google.html
```

不要用 `file://` 開 `google.html`。API routes 只有透過 local server 或 Netlify 才會動。

## Netlify 設定

Project environment variable：

```text
GOOGLE_MAPS_API_KEY=<server-key>
```

建議設定：

```text
Scope: Functions 至少要有
Context: Production 至少要有
```

Netlify build 設定：

```text
Build command: empty
Publish directory: .
Functions directory: netlify/functions
```

更新 env 後要重新部署：

```text
Deploys -> Trigger deploy -> Deploy site
```

## Google Cloud 設定

同一把 server key 需要：

```text
Application restrictions: None
API restrictions:
  - Places API
  - Routes API
```

注意：目前 `places-search.mjs` 使用的是舊版 Places Text Search endpoint，對應 Google Cloud 裡的 `Places API`。如果未來改成 Places API New endpoint，就要確認 Cloud Console 有啟用並允許對應的新 API。

## API

### `POST /api/places/search`

輸入：

```json
{
  "query": "台北101"
}
```

輸出：

```json
{
  "candidates": [
    {
      "place_id": "google_place_id",
      "name": "Taipei 101",
      "address": "Taipei 101, No. 7...",
      "lat": 25.033976,
      "lng": 121.5645389
    }
  ]
}
```

### `POST /api/quote`

輸入：

```json
{
  "origin": {
    "place_id": "google_place_id",
    "name": "Taipei 101",
    "address": "Taipei 101, No. 7...",
    "lat": 25.033976,
    "lng": 121.5645389
  },
  "destinationAirportCode": "TPE",
  "vehicleType": "comfort_4",
  "addons": {
    "sign": false,
    "childSeat": false
  }
}
```

輸出：

```json
{
  "quoteId": "Q20260701ABCDE",
  "distanceKm": 50.4,
  "distanceMeters": 50427,
  "duration": "2452s",
  "basePrice": 1100,
  "vehicleSurcharge": 0,
  "addonPrice": 0,
  "totalPrice": 1100,
  "pricingMethod": "機場固定價目表：臺北市 ⇄ TPE",
  "routeMethod": "Google Routes API driving route"
}
```

## 常見問題

### `Server Google Maps key is not configured.`

Netlify Function 讀不到 `GOOGLE_MAPS_API_KEY`。確認 env 有填 Production、Scope 包含 Functions，然後重新 deploy。

### `PERMISSION_DENIED` 或 `REQUEST_DENIED`

Google key 的 API restriction、Application restriction、API 啟用狀態或 billing 有問題。先確認 Places API / Routes API 已啟用，且 key 允許這兩個 API。

### Local 可以，Netlify 不行

通常是 Netlify env 沒填 Production，或填完後沒有重新 deploy。

### `file://` 開頁面不動

正常。請用 `http://127.0.0.1:8080/google.html`。
