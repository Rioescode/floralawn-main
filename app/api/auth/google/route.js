import { getAuthUrl } from '@/lib/google-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const url = getAuthUrl(userId);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Failed to generate auth URL:', error);
    return NextResponse.json({ error: 'Failed to initiate Google Auth' }, { status: 500 });
  }
}
