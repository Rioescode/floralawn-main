import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { emailLayout, heading, paragraph, steps, button, buttonRow, signature, escapeHtml, siteUrl } from '@/libs/email-template';

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

    const userName = escapeHtml((name || email.split('@')[0] || 'there').split(' ')[0]);

    const emailHtml = emailLayout({
      preheader: 'Your yard account is ready. See your next visit, skip a week, or ask for a quote.',
      body: [
        heading(`Welcome, ${userName}.`, 'Your yard account is ready.'),
        paragraph('Everything about your property lives in one place now:'),
        steps([
          '<strong>See your next visit</strong> and the service we are doing.',
          '<strong>Skip a week or change the date</strong> in two taps.',
          '<strong>Ask for a quote</strong> on mowing, cleanups, mulch, hedges, or snow.',
          '<strong>Watch your lawn</strong> through the seasons on your yard picture.',
        ]),
        buttonRow([button(siteUrl('/customer/dashboard'), 'Open your yard')]),
        paragraph('Questions? Reply to this email or call <a href="tel:4013890913" style="color:#2F6B4F;font-weight:700;">(401) 389-0913</a>.'),
        signature(),
      ].join(''),
    });

    await sendEmail({
      to: email,
      subject: 'Your Flora Lawn yard account is ready',
      text: `Welcome to Flora Lawn. Your yard account is ready. See your next visit, skip or change a date, and ask for quotes at ${siteUrl('/customer/dashboard')}. Questions? Call (401) 389-0913.`,
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
