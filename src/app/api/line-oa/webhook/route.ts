import { NextRequest, NextResponse } from 'next/server';
import { validateLineSignature, handleLineWebhookEvent, getRawLineChannelSecret } from '@/lib/line-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-line-signature') || '';

    const channelSecret = getRawLineChannelSecret() || '';
    const isValid = validateLineSignature(rawBody, signature, channelSecret);

    if (!isValid && process.env.NODE_ENV === 'production' && channelSecret) {
      return NextResponse.json({ error: 'Invalid LINE signature' }, { status: 403 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    const events = payload.events || [];
    const results = [];

    for (const event of events) {
      const res = await handleLineWebhookEvent(event);
      results.push(res);
    }

    return NextResponse.json({
      status: 'success',
      eventsProcessed: events.length,
      results
    });
  } catch (error: any) {
    console.error('LINE Webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
