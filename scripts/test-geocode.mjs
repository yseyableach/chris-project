const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const address = process.argv.slice(2).join(' ') || '台北101';

if (!apiKey) {
  console.error('Missing GOOGLE_MAPS_API_KEY environment variable.');
  console.error('Example: GOOGLE_MAPS_API_KEY=your_key_here node scripts/test-geocode.mjs 台北101');
  process.exit(1);
}

const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
url.searchParams.set('address', address);
url.searchParams.set('key', apiKey);

try {
  const response = await fetch(url);
  const data = await response.json();

  console.log(JSON.stringify({
    httpStatus: response.status,
    googleStatus: data.status,
    errorMessage: data.error_message ?? null,
    firstResult: data.results?.[0]
      ? {
          formattedAddress: data.results[0].formatted_address,
          location: data.results[0].geometry?.location,
          placeId: data.results[0].place_id,
        }
      : null,
  }, null, 2));

  if (!response.ok || data.status !== 'OK') {
    process.exit(2);
  }
} catch (error) {
  console.error(error);
  process.exit(3);
}
