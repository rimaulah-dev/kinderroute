import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache: query → { results, timestamp }
const cache = new Map<string, { results: unknown[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const cacheKey = q.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json(cached.results);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=4&addressdetails=1&countrycodes=my`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'KinderRoute/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    cache.set(cacheKey, { results: data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (error) {
    console.error('[autocomplete] Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
