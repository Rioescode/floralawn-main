import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { customer_email, customer_name, lead_id, subject: customSubject, body: customBody } = await request.json();

    if (!customer_email) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    const subject = customSubject || `Update regarding your Spring Cleanup request - Flora Lawn`;
    
    // If customBody is provided, we use it for both text and a formatted HTML wrapper
    const emailBody = customBody || `Hi ${customer_name || 'there'},\n\nThank you for reaching out to us for your spring cleanup! We really appreciate the opportunity to work with you.\n\nWe wanted to let you know that we are fully booked for this week. However, if you are able to wait until next week, we would love to take care of your property!\n\nI can stop by tomorrow or Wednesday to give you an exact price for the cleanup so we are ready to go for next week.\n\nPlease let me know if this works for you, and we'll get you on the schedule!\n\nBest regards,\nFlora Lawn & Landscaping`;

    const html = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Flora Lawn & Landscaping</h1>
        </div>
        <div style="padding: 30px; white-space: pre-wrap;">${emailBody}</div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          © ${new Date().getFullYear()} Flora Lawn & Landscaping Inc. All rights reserved.
        </div>
      </div>
    `;

    const text = emailBody;

    // Send the email
    await sendEmail({
      to: customer_email,
      subject,
      text,
      html
    });

    // Optionally update the lead to note the email was sent
    if (lead_id) {
      await supabaseAdmin
        .from('contact_leads')
        .update({ 
          notes: `[Email Sent: Fully Booked] ${new Date().toLocaleString()}`
        })
        .eq('id', lead_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending fully booked email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
