import { sendTelegramNotification } from '@/lib/telegram';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await sendTelegramNotification(message);
    
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