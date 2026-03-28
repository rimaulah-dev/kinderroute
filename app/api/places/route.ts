import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!name || !lat || !lon) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 });
  }

  // Text Search — biased to the lat/lon of the kindergarten
  const query = encodeURIComponent(`${name} kindergarten`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${lat},${lon}&radius=200&key=${apiKey}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Places API ${res.status}`);
    const data = await res.json();

    const place = data.results?.[0];
    if (!place) return NextResponse.json({ found: false });

    // Optionally get a photo URL
    let photoUrl: string | undefined;
    if (place.photos?.[0]?.photo_reference) {
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`;
    }

    return NextResponse.json({
      found: true,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      isOpenNow: place.opening_hours?.open_now,
      photoUrl,
      googleMapsUrl: place.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
        : undefined,
    });
  } catch (err) {
    console.error('[Places proxy]', err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
