import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const payload = await request.json();
    
    // Resend sends the event type in the payload
    const { type, data } = payload;

    if (type === 'email.received') {
      const emailId = data.email_id;
      
      // Fetch full email content using the Receiving API
      const { data: email, error: fetchError } = await resend.emails.receiving.get(emailId);
      
      if (fetchError) {
        console.error('Error fetching inbound email content:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch email content' }, { status: 500 });
      }

      // Save to Supabase email_logs
      const { error: dbError } = await supabase.from('email_logs').insert({
        recipient_email: email.from || 'Customer',
        recipient_name: 'Admin',
        subject: email.subject || 'Inbound Message',
        body_html: email.html || email.text || '',
        type: 'INBOUND',
        direction: 'INBOUND',
        created_at: email.created_at,
        // Optional: save sender for reference
        // from_email: email.from 
      });

      if (dbError) {
        console.error('Error saving inbound email to DB:', dbError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Inbound email logged' });
    }

    return NextResponse.json({ message: 'Event ignored' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
