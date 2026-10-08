import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { emailLayout, textBlock, button, buttonRow } from '@/libs/email-template';
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

    const html = emailLayout({
      preheader: emailBody.split('\n').find((line) => line.trim() && !/^hi\b/i.test(line.trim())) || subject,
      body: [
        textBlock(emailBody).replace('margin:16px 0 0 0;', 'margin:0;'),
        buttonRow([button('tel:4013890913', 'Call (401) 389-0913'), button('mailto:floralawncareri@gmail.com', 'Reply by email', 'outline')]),
      ].join(''),
    });

    const text = emailBody;

    // Send the email
    await sendEmail({
      to: customer_email,
      subject,
      text,
      html,
      recipientName: customer_name
    });

    // Optionally update the lead to note the email was sent
    if (lead_id) {
      const { data: lead } = await supabaseAdmin
        .from('contact_leads')
        .select('notes')
        .eq('id', lead_id)
        .maybeSingle();
      const stamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
      await supabaseAdmin
        .from('contact_leads')
        .update({
          notes: `${lead?.notes ? `${lead.notes}\n\n` : ''}[Email sent: fully booked] ${stamp}`
        })
        .eq('id', lead_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending fully booked email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
