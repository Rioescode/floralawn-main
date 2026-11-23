import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { emptyCallerVariables, lookupCaller } from '@/libs/flora-caller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function initiationPayload(variables) {
  return {
    type: 'conversation_initiation_client_data',
    dynamic_variables: variables,
    conversation_initiation_client_data: {
      dynamic_variables: variables,
    },
  };
}

function authorized(request) {
  const secret = (process.env.ELEVENLABS_FLORA_INIT_SECRET || '').trim();
  const header = (request.headers.get('x-flora-init-secret') || '').trim();
  if (!secret || !header) return false;
  const provided = Buffer.from(header);
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

function callerId(body) {
  return body?.caller_id || body?.callerId || body?.from || body?.From || '';
}

export async function POST(request) {
  const secret = (process.env.ELEVENLABS_FLORA_INIT_SECRET || '').trim();
  if (!secret) {
    console.error('ELEVENLABS_FLORA_INIT_SECRET is not set');
    return NextResponse.json(initiationPayload(emptyCallerVariables()));
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { variables } = await lookupCaller(callerId(body));
  return NextResponse.json(initiationPayload(variables));
}
