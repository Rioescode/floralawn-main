import { NextResponse } from 'next/server';
import { handleSupabaseWebhook } from '@/libs/mgr-crew-intake';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body = null;
  let invalidJson = false;
  try {
    body = await request.json();
  } catch {
    invalidJson = true;
  }

  const result = await handleSupabaseWebhook({
    configuredSecret: process.env.FLORA_DB_WEBHOOK_SECRET,
    providedSecret: request.headers.get('x-flora-webhook-secret'),
    body,
    invalidJson,
  });

  return NextResponse.json(result.body, { status: result.status });
}
