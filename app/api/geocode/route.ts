import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30; // seconds

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  const lat = searchParams.get('lat') || '3.1';
  const lon = searchParams.get('lon') || '101.7';
  const limit = searchParams.get('limit') || '1';
  const lang = searchParams.get('lang') || 'en';

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}&lang=${lang}&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'KinderRoute/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Photon API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[Geocode proxy] Error:', err);
    return NextResponse.json(
      { error: `Geocoding failed: ${err}` },
      { status: 502 }
    );
  }
}
