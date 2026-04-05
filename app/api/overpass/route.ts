import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 20;

const PER_MIRROR_TIMEOUT_MS = 8000;
const TOTAL_BUDGET_MS = 15000;

type MirrorAttempt = {
  mirror: string;
  elapsedMs: number;
  timedOut: boolean;
  status?: number;
  error?: string;
};

export async function POST(req: NextRequest) {
  const body = await req.text(); // expects "data=<url-encoded-query>"

  const MIRRORS = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  const attempts: MirrorAttempt[] = [];
  const startedAt = Date.now();

  for (const mirror of MIRRORS) {
    const elapsedTotal = Date.now() - startedAt;
    const remainingBudget = TOTAL_BUDGET_MS - elapsedTotal;
    if (remainingBudget <= 0) break;

    const timeoutMs = Math.min(PER_MIRROR_TIMEOUT_MS, remainingBudget);
    const attemptStart = Date.now();

    try {
      const response = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        attempts.push({
          mirror,
          elapsedMs: Date.now() - attemptStart,
          timedOut: false,
          status: response.status,
          error: `HTTP ${response.status}`,
        });
        console.warn(`[Overpass proxy] ${mirror} → HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === 'TimeoutError';
      const errorText = err instanceof Error ? err.message : String(err);
      attempts.push({
        mirror,
        elapsedMs: Date.now() - attemptStart,
        timedOut: isTimeout,
        error: errorText,
      });
      console.warn(`[Overpass proxy] ${mirror} → ${errorText}`);
    }
  }

  const totalElapsedMs = Date.now() - startedAt;

  return NextResponse.json(
    {
      error: 'All Overpass mirrors failed within time budget',
      reason: totalElapsedMs >= TOTAL_BUDGET_MS ? 'timeout_budget_exceeded' : 'all_mirrors_failed',
      timedOut: totalElapsedMs >= TOTAL_BUDGET_MS,
      totalElapsedMs,
      attempts,
    },
    { status: 502 }
  );
}
