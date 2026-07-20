import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;

type ClaimRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  kindergartenName: string;
  lat?: number;
  lon?: number;
  createdAt: string;
};

const claimStore: ClaimRecord[] =
  ((globalThis as { __kinderrouteClaims?: ClaimRecord[] }).__kinderrouteClaims ??= []);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message, kindergartenName, lat, lon } = body ?? {};

    if (!name || !email || !kindergartenName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, kindergartenName' },
        { status: 400 }
      );
    }

    const record: ClaimRecord = {
      id: crypto.randomUUID(),
      name: String(name),
      email: String(email),
      phone: phone ? String(phone) : undefined,
      message: message ? String(message) : undefined,
      kindergartenName: String(kindergartenName),
      lat: typeof lat === 'number' ? lat : undefined,
      lon: typeof lon === 'number' ? lon : undefined,
      createdAt: new Date().toISOString(),
    };

    claimStore.push(record);

    // Log it server-side so it shows in deployment logs
    console.log('[CLAIM REQUEST]', record);

    const webhookUrl = process.env.CLAIM_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    }

    return NextResponse.json({ success: true, claimId: record.id, createdAt: record.createdAt });
  } catch (err) {
    console.error('[Claim API]', err);
    return NextResponse.json({ error: 'Failed to process claim' }, { status: 500 });
  }
}
