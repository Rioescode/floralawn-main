import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';

export async function POST(request) {
  try {
    const { email, name, subject, html, docType } = await request.json();

    if (!email || !html) {
      return NextResponse.json({ error: 'Email and content are required' }, { status: 400 });
    }

    console.log(`📧 Sending ${docType || 'Document'} to ${email} via Resend...`);

    const result = await sendEmail({
      to: email,
      subject: subject || `Elite ${docType || 'Inovice'} from Flora Lawn & Landscaping`,
      html: html,
      replyTo: 'floralawncareri@gmail.com'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      id: result?.id 
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { error: 'Failed to send email: ' + error.message },
      { status: 500 }
    );
  }
}
