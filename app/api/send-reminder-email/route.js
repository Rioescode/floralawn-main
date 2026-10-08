import { sendEmail } from '@/libs/resend';
import { emailLayout, heading, section, detailsTable, button, buttonRow, escapeHtml, siteUrl } from '@/libs/email-template';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { job, diffDays } = await request.json();

    if (!job) {
      return NextResponse.json({ error: 'Job data is required' }, { status: 400 });
    }

    const subject = `Reminder: ${job.customer_name} in ${diffDays} day${diffDays === 1 ? '' : 's'} · ${job.service_type || 'Yard service'}`;
    const phoneDigits = String(job.customer_phone || '').replace(/\D/g, '');
    const place = job.address || job.city || '';

    const html = emailLayout({
      preheader: `${job.customer_name} on ${job.visit_date}. ${job.service_type || 'Yard service'}.`,
      footerNote: 'Automatic reminder from your Flora Lawn schedule.',
      body: [
        `<p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2F6B4F;">Job in ${escapeHtml(diffDays)} day${diffDays === 1 ? '' : 's'}</p>`,
        heading(job.customer_name || 'Customer', escapeHtml(job.visit_date || '')),
        section('Job', detailsTable([
          { label: 'Service', value: job.service_type || 'Yard service' },
          { label: 'Date', value: job.visit_date },
          { label: 'Address', value: place || 'No address' },
          { label: 'Phone', value: job.customer_phone || 'No phone' },
        ])),
        buttonRow([
          button(siteUrl('/schedule'), 'Open schedule'),
          phoneDigits ? button(`sms:${phoneDigits}`, 'Text customer', 'dark') : '',
          place ? button(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`, 'Map', 'outline') : '',
        ]),
      ].join(''),
    });

    const result = await sendEmail({
      to: 'floralawncareri@gmail.com',
      subject: subject,
      text: `Reminder: Job for ${job.customer_name} is in ${diffDays} days (${job.visit_date}).`,
      html: html,
      replyTo: 'floralawncareri@gmail.com'
    });
    
    return NextResponse.json({ 
      success: true, 
      sent: !!result 
    });
  } catch (error) {
    console.error('Error in send-reminder-email API:', error);
    return NextResponse.json({ 
      error: 'Failed to send email reminder',
      success: false 
    }, { status: 500 });
  }
}
