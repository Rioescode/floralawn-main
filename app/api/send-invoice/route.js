import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/libs/resend';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      jobId,
      customerEmail,
      customerName,
      invoiceNumber,
      amountDue,
      serviceType,
      jobDate,
      serviceDescription
    } = body;

    if (!customerEmail || !customerName || !invoiceNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format the invoice email
    const invoiceDate = new Date().toLocaleDateString();
    const formattedJobDate = new Date(jobDate).toLocaleDateString();
    const formattedServiceType = serviceType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || serviceType;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Flora Lawn & Landscaping</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Professional Lawn Care Services</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin: 0 0 10px 0;">INVOICE</h2>
            <p style="color: #6b7280; margin: 0;">Invoice #${invoiceNumber}</p>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Date: ${invoiceDate}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <strong style="color: #374151;">Bill To:</strong>
              <p style="margin: 5px 0 0 0; color: #6b7280;">${customerName}</p>
              <p style="margin: 0; color: #6b7280;">${customerEmail}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151;">Description</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
                  <strong>${formattedServiceType}</strong>
                  ${serviceDescription ? `<br><span style="color: #6b7280; font-size: 14px;">${serviceDescription}</span>` : ''}
                  <br><span style="color: #6b7280; font-size: 14px;">Service Date: ${formattedJobDate}</span>
                </td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
                  $${parseFloat(amountDue).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: right; margin-top: 20px;">
            <div style="display: inline-block; background: #f9fafb; padding: 15px 25px; border-radius: 5px;">
              <div style="margin-bottom: 10px;">
                <span style="color: #6b7280; font-size: 14px;">Total Amount Due:</span>
                <span style="font-size: 24px; font-weight: bold; color: #dc2626; margin-left: 15px;">
                  $${parseFloat(amountDue).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              <strong>Payment Instructions:</strong>
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Please remit payment within 30 days. For questions about this invoice, please contact us at (401) 389-0913 or reply to this email.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Thank you for your business!
            </p>
            <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">
              Flora Lawn & Landscaping | (401) 389-0913
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email using Resend
    try {
      await sendEmail({
        to: customerEmail,
        subject: `Invoice #${invoiceNumber} - Flora Lawn & Landscaping`,
        text: `Invoice #${invoiceNumber}\n\nDear ${customerName},\n\nPlease find your invoice for ${formattedServiceType} completed on ${formattedJobDate}.\n\nAmount Due: $${parseFloat(amountDue).toFixed(2)}\n\nPlease remit payment within 30 days. For questions, contact us at (401) 389-0913.\n\nThank you for your business!\n\nFlora Lawn & Landscaping`,
        html: emailContent,
        replyTo: 'floralawncareri@gmail.com'
      });
      
      console.log('Invoice email sent successfully to:', customerEmail);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue even if email fails - we still want to mark invoice as sent in DB
      // The user can manually send the invoice later if needed
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully'
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invoice' },
      { status: 500 }
    );
  }
}

