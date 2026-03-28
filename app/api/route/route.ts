import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30; // seconds

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const coords = searchParams.get('coords');

  if (!coords) {
    return NextResponse.json({ error: 'Missing query parameter "coords"' }, { status: 400 });
  }

  // coords format: "lon1,lat1;lon2,lat2"
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'KinderRoute/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OSRM API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[Route proxy] Error:', err);
    return NextResponse.json(
      { error: `Routing failed: ${err}` },
      { status: 502 }
    );
  }
}
