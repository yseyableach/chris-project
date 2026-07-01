const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  },
  body: JSON.stringify(body),
});

const googleStatusMessage = {
  REQUEST_DENIED: 'Google 拒絕地點搜尋，請確認後端 key、Places API、billing 與 API 限制。',
  PERMISSION_DENIED: 'Google 地點搜尋權限不足，請確認 Places API 已啟用，且此 key 可用於 server-side request。',
  RESOURCE_EXHAUSTED: 'Google 地點搜尋超過配額，請稍後再試或調整配額。',
  INVALID_ARGUMENT: '地點搜尋請求不完整。',
  OVER_QUERY_LIMIT: 'Google 地點搜尋超過配額，請稍後再試或調整配額。',
  ZERO_RESULTS: '找不到候選地點，請輸入更完整地址。',
  INVALID_REQUEST: '地點搜尋請求不完整。',
};

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return json(500, { error: 'Server Google Maps key is not configured.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const query = String(payload.query || '').trim();
  if (query.length < 2) {
    return json(400, { error: '請輸入至少 2 個字的地點或地址。' });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('language', 'zh-TW');
    url.searchParams.set('region', 'tw');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      const status = data.status;
      return json(502, {
        error: googleStatusMessage[status] || data.error_message || `Google 地點搜尋失敗：${status || response.status}`,
        googleStatus: status || null,
      });
    }

    const candidates = (data.results || []).slice(0, 6).map((place) => ({
      place_id: place.place_id,
      name: place.name || place.formatted_address,
      address: place.formatted_address,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
    })).filter((candidate) => (
      candidate.place_id &&
      Number.isFinite(candidate.lat) &&
      Number.isFinite(candidate.lng)
    ));

    return json(200, { candidates });
  } catch (error) {
    return json(502, { error: error.message || 'Google 地址搜尋連線失敗。' });
  }
}
