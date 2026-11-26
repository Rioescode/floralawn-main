import { sendTelegramNotification } from '@/lib/telegram';
import { NextResponse } from 'next/server';
import { clientIp, isSameOrigin, overLimit } from '@/lib/spam-guard';

export async function POST(request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
    if (overLimit(`notify-ip:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await sendTelegramNotification(message.slice(0, 1000));
    
    return NextResponse.json({ 
      success: true, 
      sent: !!result 
    });
  } catch (error) {
    console.error('Error in send-notification API:', error);
    return NextResponse.json({ 
      error: 'Failed to send notification',
      success: false 
    }, { status: 500 });
  }
} 