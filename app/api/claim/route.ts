import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message, kindergartenName, lat, lon } = body;

    // Log it server-side so it shows in deployment logs
    console.log('[CLAIM REQUEST]', { name, email, phone, message, kindergartenName, lat, lon, timestamp: new Date().toISOString() });

    // If you want to send email notifications, add email logic here later
    // For now, just return success
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Claim API]', err);
    return NextResponse.json({ error: 'Failed to process claim' }, { status: 500 });
  }
}
