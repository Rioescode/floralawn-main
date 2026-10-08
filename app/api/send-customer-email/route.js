import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { emailLayout, signature } from '@/libs/email-template';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { email, subject, message } = body;

    if (!email || !subject || !message) {
      return NextResponse.json({ error: 'Email, subject, and message are required' }, { status: 400 });
    }

    const emailHtml = emailLayout({
      preheader: message.replace(/<[^>]+>/g, '').slice(0, 120),
      body: `<div style="font-size:15px;line-height:1.7;">${message.replace(/\n/g, '<br/>')}</div>${signature()}`,
    });

    await sendEmail({
      to: email,
      subject: subject,
      text: message,
      html: emailHtml,
      replyTo: 'floralawncareri@gmail.com'
    });

    return NextResponse.json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('Error sending customer email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
