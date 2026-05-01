import { sendEmail } from '@/libs/resend';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { job, diffDays } = await request.json();

    if (!job) {
      return NextResponse.json({ error: 'Job data is required' }, { status: 400 });
    }

    const subject = `🔔 Reminder: ${diffDays} Days until ${job.customer_name}'s Job`;
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Job Reminder (${diffDays} Days Out)</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0 0 10px 0;"><strong>Customer:</strong> ${job.customer_name}</p>
          <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${job.visit_date}</p>
          <p style="margin: 0 0 10px 0;"><strong>Service:</strong> ${job.service_type || 'General Service'}</p>
          <p style="margin: 0 0 10px 0;"><strong>Address:</strong> ${job.address || job.city || 'No address'}</p>
          <p style="margin: 0 0 10px 0;"><strong>Phone:</strong> ${job.customer_phone || 'No phone'}</p>
        </div>
        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          This is an automated reminder from your Flora Lawn Dashboard.
        </p>
        <a href="https://floralawn-and-landscaping.com/schedule" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">View Schedule</a>
      </div>
    `;

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
