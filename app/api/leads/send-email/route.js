import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { emailLayout, heading, textBlock, signature } from '@/libs/email-template';

export async function POST(request) {
  try {
    const { to, subject, message, leadName } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'To, subject, and message are required' },
        { status: 400 }
      );
    }

    const emailHtml = emailLayout({
      preheader: message.slice(0, 120),
      body: [
        heading(`Hi ${leadName || 'there'},`),
        textBlock(message),
        signature(),
      ].join(''),
    });

    await sendEmail({
      to,
      subject,
      text: message,
      html: emailHtml,
      replyTo: 'floralawncareri@gmail.com'
    });

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}


