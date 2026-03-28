import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // seconds - allow Overpass up to 60s

export async function POST(req: NextRequest) {
  const body = await req.text(); // expects "data=<url-encoded-query>"

  const MIRRORS = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  let lastError = '';

  for (const mirror of MIRRORS) {
    try {
      const response = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        lastError = `${mirror} → HTTP ${response.status}`;
        console.warn(`[Overpass proxy] ${lastError}`);
        continue;
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (err) {
      lastError = `${mirror} → ${err}`;
      console.warn(`[Overpass proxy] ${lastError}`);
    }
  }

  return NextResponse.json(
    { error: `All Overpass mirrors failed. Last: ${lastError}` },
    { status: 502 }
  );
}
