import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { appointmentId, message, sendEmail: sendEmailFlag, sendSMS: sendSMSFlag, customerData } = await request.json();

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
          const emailSubject = `Service Completed - ${appointment.service_type}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #22C55E;">Service Completed!</h2>
              <p>Hi ${appointment.customer_name},</p>
              <p>${message || 'Your service has been completed successfully!'}</p>
              <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Service:</strong> ${appointment.service_type}</p>
                <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
              </div>
              <p>Thank you for choosing Flora Lawn and Landscaping!</p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">
                Flora Lawn and Landscaping Inc<br>
                Phone: (401) 389-0913
              </p>
            </div>
          `;

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

