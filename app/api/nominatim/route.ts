import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30; // seconds

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  const format = searchParams.get('format') || 'json';
  const limit = searchParams.get('limit') || '1';
  const countrycodes = searchParams.get('countrycodes');

  let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=${format}&limit=${limit}`;
  if (countrycodes) {
    url += `&countrycodes=${countrycodes}`;
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'KinderRoute/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Nominatim API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[Nominatim proxy] Error:', err);
    return NextResponse.json(
      { error: `Geocoding failed: ${err}` },
      { status: 502 }
    );
  }
}
