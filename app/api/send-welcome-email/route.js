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
    const { email, name } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const userName = (name || email.split('@')[0] || 'there').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22C55E;">Welcome to Flora Lawn & Landscaping!</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for creating an account with Flora Lawn & Landscaping Inc!</p>
        <p>We're excited to help you maintain a beautiful lawn and landscape. With your account, you can:</p>
        <ul style="line-height: 1.8;">
          <li>📅 View and manage your scheduled services</li>
          <li>⏭️ Skip or reschedule appointments</li>
          <li>❌ Cancel services when needed</li>
          <li>📋 View your service history</li>
          <li>💬 Request new services easily</li>
        </ul>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Get Started:</strong></p>
          <p>Visit your customer dashboard to manage your services:</p>
          <a href="https://floralawn-and-landscaping.com/customer/dashboard" 
             style="display: inline-block; background-color: #22C55E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Go to Dashboard →
          </a>
        </div>
        <p>If you have any questions, feel free to reach out to us:</p>
        <p>📞 Phone: (401) 389-0913<br>
        📧 Email: floralawncareri@gmail.com</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <!-- Email Signature -->
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
      subject: 'Welcome to Flora Lawn & Landscaping!',
      text: `Welcome to Flora Lawn & Landscaping! Thank you for creating an account. Visit https://floralawn-and-landscaping.com/customer/dashboard to manage your services.`,
      html: emailHtml,
      replyTo: 'floralawncareri@gmail.com'
    });

    return NextResponse.json({ success: true, message: 'Welcome email sent' });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}

