import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';

export async function POST(request) {
  try {
    const { to, subject, message, leadName } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'To, subject, and message are required' },
        { status: 400 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22C55E;">Hello from Flora Lawn & Landscaping!</h2>
        <p>Hi ${leadName || 'there'},</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p>Thank you for your interest in our services!</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Flora Lawn & Landscaping Inc<br>
          Phone: (401) 389-0913<br>
          Email: floralawncareri@gmail.com
        </p>
      </div>
    `;

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


