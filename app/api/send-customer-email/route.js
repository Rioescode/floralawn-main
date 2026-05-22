import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';

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

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <div style="padding: 20px 0;">
          ${message.replace(/\n/g, '<br/>')}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 540px; margin: 20px auto 0;">
          <tr>
            <td style="padding: 0; vertical-align: middle; padding-right: 16px; border-right: 1px solid #e5e7eb; width: 68px;">
              <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn" style="width: 64px; height: 64px; object-fit: contain; display: block;">
            </td>
            <td style="padding: 0; vertical-align: middle; padding-left: 16px;">
              <p style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; line-height: 1.3;">Rafael Escobar</p>
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #22C55E; text-transform: uppercase; letter-spacing: 0.05em;">Owner &middot; Flora Lawn &amp; Landscaping Inc</p>
              <div style="height: 8px;"></div>
              <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.8;">
                📞 <a href="tel:4013890913" style="color: #475569; text-decoration: none;">(401) 389-0913</a><br>
                📧 <a href="mailto:floralawncareri@gmail.com" style="color: #475569; text-decoration: none;">floralawncareri@gmail.com</a><br>
                🌐 <a href="https://floralawn-and-landscaping.com" style="color: #22C55E; text-decoration: none;">floralawn-and-landscaping.com</a><br>
                📍 45 Vernon St, Pawtucket, RI 02860
              </p>
            </td>
          </tr>
        </table>
      </div>
    `;

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
