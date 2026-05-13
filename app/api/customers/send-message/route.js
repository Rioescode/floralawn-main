import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { appointmentId, message, sendEmail: sendEmailFlag, sendSMS: sendSMSFlag, customerData, type, subject } = await request.json();

    let appointment;

    // If customerData is provided directly (from schedule page), use it
    if (customerData) {
      appointment = customerData;
    } else if (appointmentId) {
      // Otherwise, fetch appointment details
      const { data, error: aptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (aptError || !data) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }
      appointment = data;
    } else {
      return NextResponse.json({ error: 'Appointment ID or customer data is required' }, { status: 400 });
    }

    const results = {
      emailSent: false,
      smsSent: false,
      errors: []
    };

    // Send email if requested
    if (sendEmailFlag && appointment.customer_email) {
      try {
        // Try to use Resend if available
        try {
          const { sendEmail } = await import('@/libs/resend');
          
          let emailSubject = subject || `Service Update - Flora Lawn`;
          let emailHtml = '';

          if (type === 'review') {
            const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://floralawn-and-landscaping.com';
            const reviewLink = `${baseUrl}/review`;
            
            emailSubject = subject || `Quick question regarding your service 🌿`;
            emailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #334155;">
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hi ${appointment.customer_name?.split(' ')[0] || 'there'},</p>
                
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">I'm just checking in to make sure you're happy with how everything looks at your property!</p>
                
                ${message ? `
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #1e293b;"><em>"${message}"</em></p>
                ` : ''}
                
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">As a small local team, your feedback really helps us out. If you have a moment, would you mind sharing a quick note about your experience with us?</p>
                
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                  <strong>You can share your thoughts here:</strong><br>
                  <a href="${reviewLink}" style="color: #2563eb; text-decoration: underline;">${reviewLink}</a>
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">Thanks again for choosing us!</p>
                <p style="font-size: 16px; line-height: 1.6; font-weight: 700; margin-bottom: 40px;">Flora Lawn & Landscaping</p>
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;">
                
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
                  Flora Lawn & Landscaping Inc.<br>
                  (401) 389-0913 • floralawncareri@gmail.com<br>
                  Rhode Island's Lawn Care Experts
                </p>
              </div>
            `;
          } else if (type === 'completed' || subject?.toLowerCase().includes('completed')) {
            const formattedService = (appointment.service_type || 'service').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const displayDate = appointment.date ? new Date(appointment.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString();
            
            emailSubject = subject || `Job Completed! 🌿 - Flora Lawn & Landscaping`;
            emailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 50px 20px; text-align: center;">
                  <div style="background-color: rgba(255, 255, 255, 0.2); width: 64px; height: 64px; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 32px;">✨</div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.04em;">Mission Accomplished!</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin-top: 10px; font-size: 16px; font-weight: 500;">Your property is looking better than ever.</p>
                </div>
                
                <div style="padding: 40px 40px 30px;">
                  <p style="font-size: 18px; color: #1e293b; margin: 0 0 20px; font-weight: 600;">Hi ${appointment.customer_name?.split(' ')[0] || 'there'},</p>
                  <p style="font-size: 16px; line-height: 1.7; color: #475569; margin: 0 0 30px;">Great news! Our team just finished up the <strong>${formattedService}</strong> at your property. We took great care with every detail to ensure everything looks perfect.</p>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 20px; padding: 25px; margin-bottom: 30px;">
                    <div style="display: flex; margin-bottom: 15px;">
                      <div style="width: 100%;">
                        <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700;">Service Performed</p>
                        <p style="margin: 4px 0 0; font-size: 16px; color: #1e293b; font-weight: 600;">${formattedService}</p>
                      </div>
                    </div>
                    <div style="width: 100%;">
                      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700;">Completion Date</p>
                      <p style="margin: 4px 0 0; font-size: 16px; color: #1e293b; font-weight: 600;">${displayDate}</p>
                    </div>
                  </div>

                  ${message ? `
                  <div style="border-left: 4px solid #10b981; padding: 10px 20px; margin-bottom: 30px; background-color: #f0fdf4; border-radius: 0 12px 12px 0;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #065f46; font-style: italic;">"${message}"</p>
                  </div>
                  ` : ''}
                  
                  <p style="font-size: 16px; line-height: 1.7; color: #475569; margin: 0 0 20px;">We take massive pride in our work. If you have any questions or if there is anything else we can help you with, please don't hesitate to reach out.</p>
                  
                  <div style="text-align: center; margin-top: 40px;">
                    <a href="mailto:floralawncareri@gmail.com" style="display: inline-block; background-color: #1e293b; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">Reply to this Email</a>
                  </div>
                </div>

                <div style="background-color: #f8fafc; padding: 40px; text-align: center; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0; font-size: 16px; font-weight: 800; color: #1e293b;">Flora Lawn & Landscaping</p>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">Rhode Island's Lawn Care Experts</p>
                  <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">(401) 389-0913 • floralawncareri@gmail.com</p>
                    <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e1;">&copy; ${new Date().getFullYear()} Flora Lawn & Landscaping Inc. All rights reserved.</p>
                  </div>
                </div>
              </div>
            `;
          } else {
            emailSubject = subject || `Service Update - ${appointment.service_type || 'Flora Lawn'}`;
            emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #22C55E; padding: 20px; text-align: center;">
                  <h2 style="color: #ffffff; margin: 0;">Service Update</h2>
                </div>
                <div style="padding: 30px;">
                  <p>Hi ${appointment.customer_name || 'there'},</p>
                  <p>${message || 'Your service has been updated.'}</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    ${appointment.service_type ? `<p style="margin: 0;"><strong>Service:</strong> ${appointment.service_type}</p>` : ''}
                    ${appointment.date ? `<p style="margin: 5px 0 0;"><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>` : ''}
                  </div>
                  <p>Thank you for choosing Flora Lawn and Landscaping!</p>
                </div>
              </div>
            `;
          }

          await sendEmail({
            to: appointment.customer_email,
            subject: emailSubject,
            text: message || 'Your service has been completed successfully!',
            html: emailHtml,
            replyTo: 'floralawncareri@gmail.com', // Add reply-to for better deliverability
            type: type, // Pass specific type for logging
            recipientName: appointment.customer_name // Pass recipient name for logging
          });

          results.emailSent = true;
        } catch (importError) {
          // If email service not available, provide email link
          const emailSubject = encodeURIComponent(`Service Completed - ${appointment.service_type}`);
          const emailBody = encodeURIComponent(message || 'Your service has been completed successfully!');
          results.emailLink = `mailto:${appointment.customer_email}?subject=${emailSubject}&body=${emailBody}`;
          results.emailSent = false;
          results.errors.push('Email service not configured - use email link instead');
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        results.errors.push('Failed to send email');
      }
    }

    // Send SMS if requested
    if (sendSMSFlag && appointment.customer_phone) {
      try {
        // Try to use Twilio if available
        try {
          const { sendSMS } = await import('@/libs/twilio');
          await sendSMS(
            appointment.customer_phone,
            message || 'Your service has been completed!'
          );
          results.smsSent = true;
        } catch (importError) {
          // If SMS service not available, provide SMS link as fallback
          const phoneNumber = appointment.customer_phone.replace(/\D/g, '');
          results.smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(message || 'Your service has been completed!')}`;
          results.smsSent = false;
          results.errors.push('SMS service not configured - use SMS link instead');
        }
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
        // Fallback to SMS link
        const phoneNumber = appointment.customer_phone.replace(/\D/g, '');
        results.smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(message || 'Your service has been completed!')}`;
        results.errors.push('Failed to send SMS - use SMS link instead');
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

