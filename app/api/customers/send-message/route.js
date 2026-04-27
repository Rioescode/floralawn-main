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
            emailSubject = subject || `Help us grow! 🌿 - Flora Lawn & Landscaping`;
            emailHtml = `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #0f172a; padding: 40px 20px; text-align: center;">
                  <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn" style="width: 80px; height: 80px; margin-bottom: 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">How did we do?</h1>
                </div>
                <div style="padding: 40px 32px;">
                  <p style="font-size: 18px; line-height: 1.6; color: #1e293b; margin-top: 0;">Hi ${appointment.customer_name || 'there'},</p>
                  <p style="font-size: 16px; line-height: 1.6; color: #475569;">Thank you for choosing <strong>Flora Lawn & Landscaping Inc</strong>. We hope you're loving the way your property looks!</p>
                  <p style="font-size: 16px; line-height: 1.6; color: #475569;">Would you mind taking 30 seconds to share your experience with us? Your feedback helps us grow and continue providing elite service to our community.</p>
                  
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="https://g.page/r/CQjJ-AbEL4N2EBE/review" style="background-color: #22c55e; color: #ffffff; padding: 18px 36px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.3);">
                      ⭐ Leave a Review
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">If you had any issues with your service, please reply to this email so we can make it right immediately.</p>
                </div>
                <div style="background-color: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">Flora Lawn & Landscaping Inc</p>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Elite Lawn Care & Landscaping Services</p>
                  <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">(401) 389-0913 • floralawncareri@gmail.com</p>
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
                  <p>Hi ${appointment.customer_name},</p>
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
            replyTo: 'floralawncareri@gmail.com' // Add reply-to for better deliverability
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

