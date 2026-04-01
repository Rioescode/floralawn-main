import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { generalApiLimiter } from '@/lib/rate-limiter';
import { validateEmail, validatePhone, sanitizeText } from '@/lib/validation';

function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

export async function POST(request) {
  try {
    // Rate limiting check (30 requests per minute per IP)
    const rateLimitResult = await generalApiLimiter(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // Get client IP for logging
    const clientIP = getClientIP(request);

    // Validate origin (optional but recommended)
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const allowedOrigins = [
      'https://floralawn-and-landscaping.com',
      'https://riyardworks.com',
      'http://localhost:3000' // For development
    ];
    
    if (origin && !allowedOrigins.some(allowed => origin.includes(allowed))) {
      console.warn(`Invalid origin: ${origin}`);
      // Don't block, but log it
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { email, name, service, message, phone, address, city, sendSMS, hasMedia, mediaUrls, discountApplied } = body;

    // Input validation
    if (!email || !name) {
      console.error('Missing required fields:', { email: !!email, name: !!name });
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = sanitizeText(name, 100);
    const sanitizedService = sanitizeText(service || '', 100);
    const sanitizedMessage = sanitizeText(message || '', 2000);
    const sanitizedAddress = sanitizeText(address || 'Not Provided', 200);
    const sanitizedCity = sanitizeText(city || 'RI', 100);

    // Additional validation
    if (sanitizedName.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    if (sanitizedEmail.length > 254) {
      return NextResponse.json({ error: 'Email address is too long' }, { status: 400 });
    }

    console.log('Received contact confirmation request:', { 
      email: sanitizedEmail, 
      name: sanitizedName, 
      service: sanitizedService ? 'provided' : 'none',
      ip: clientIP
    });

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
        <div style="background-color: #0f172a; padding: 40px; text-align: center; border-bottom: 5px solid #22c55e;">
          <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn & Landscaping" style="width: 180px; height: auto; margin-bottom: 15px;">
          <p style="color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; margin-top: 8px; font-weight: 800;">Professional Property Care</p>
        </div>

        <div style="padding: 40px;">
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-top: 0; margin-bottom: 10px; font-style: italic;">Thank You for Choosing Us!</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">Hi ${sanitizedName}, we've successfully received your inquiry for <strong>${sanitizedService}</strong>. Our team will review your property and provide your estimate within <strong>1-6 hours</strong>.</p>

          ${discountApplied ? `
          <div style="background-color: #f0fdf4; border: 2px dashed #22c55e; padding: 25px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
              <p style="color: #166534; font-weight: 900; font-style: italic; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">
                  ✅ 10% Visual Credit Applied
              </p>
              <p style="color: #475569; font-size: 11px; font-weight: 600; margin-top: 5px;">
                  Your property visuals have been locked in for your discount!
              </p>
          </div>
          ` : ''}

          <div style="background-color: #f8fafc; padding: 25px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #f1f5f9;">
            <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #94a3b8; margin-bottom: 15px; letter-spacing: 0.1em; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Inquiry Confirmation</p>
            <div style="margin-bottom: 15px;">
              <span style="color: #64748b; font-size: 12px; font-weight: 600;">Service Requested:</span><br>
              <span style="color: #0f172a; font-size: 14px; font-weight: 700;">${sanitizedService}</span>
            </div>
            <div style="margin-bottom: 5px;">
              <span style="color: #64748b; font-size: 12px; font-weight: 600;">Property Message:</span><br>
              <span style="color: #0f172a; font-size: 14px; font-style: italic;">"${sanitizedMessage}"</span>
            </div>
            ${hasMedia ? `<p style="color: #22c55e; font-size: 11px; font-weight: 900; margin-top: 15px; text-transform: uppercase;">📸 Property Visuals Received</p>` : ''}
          </div>

          <p style="color: #0f172a; font-size: 15px; font-weight: 800; margin-bottom: 15px;">What happens next?</p>
          <div style="color: #475569; font-size: 13px; line-height: 1.8;">
            1. 📅 <strong>Review</strong>: We'll evaluate your property measurements.<br>
            2. 📨 <strong>Delivery</strong>: You'll receive your customized quote via email.<br>
            3. 📞 <strong>Confirmation</strong>: We're available for questions at (401) 389-0913.
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 10px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">
            Flora Lawn & Landscaping Inc<br>
            Pawtucket, Rhode Island
          </p>
        </div>
      </div>
    `;

    console.log('📧 Sending confirmation email via Resend to:', sanitizedEmail);
    console.log('📧 Resend API Key check:', {
      hasKey: !!process.env.RESEND_API_KEY,
      keyPrefix: process.env.RESEND_API_KEY?.substring(0, 5) || 'MISSING'
    });
    
    try {
      const customerEmailResult = await sendEmail({
        to: sanitizedEmail,
        subject: 'Thank You for Contacting Flora Lawn & Landscaping',
        text: `Thank you for contacting Flora Lawn & Landscaping! We've received your inquiry and will get back to you within 1-6 hours during business days. For immediate assistance, call (401) 389-0913.`,
        html: emailHtml,
        replyTo: 'floralawncareri@gmail.com'
      });

      // --- ADMIN LEAD DOSSIER ---
      const adminHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); background-color: #ffffff;">
            <div style="background-color: #0f172a; padding: 30px; border-bottom: 5px solid #22c55e; text-align: center;">
                <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn" style="width: 150px; height: auto; margin-bottom: 10px;">
                <h2 style="color: white; margin: 0; font-style: italic; text-transform: uppercase; letter-spacing: 0.1em; font-size: 14px;">🔥 NEW INQUIRY RECEIVED</h2>
                <p style="color: #22c55e; font-size: 10px; margin-top: 5px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;">Lead Generation Pipeline</p>
            </div>
            <div style="padding: 35px;">
                ${discountApplied ? `
                <div style="background-color: #f0fdf4; border: 2px dashed #22c55e; padding: 15px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                    <p style="color: #166534; font-weight: 900; font-style: italic; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">
                        💎 10% VISUAL CREDIT ACTIVE
                    </p>
                </div>
                ` : ''}

                <div style="margin-bottom: 30px;">
                    <p style="text-transform: uppercase; font-size: 9px; font-weight: 900; color: #94a3b8; margin-bottom: 5px; letter-spacing: 0.1em;">Customer Source Data</p>
                    <p style="font-size: 22px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -0.01em;">${sanitizedName}</p>
                    <p style="font-size: 15px; font-weight: 700; color: #22c55e; margin-top: 2px; font-style: italic;">📞 ${phone || 'No Phone'}</p>
                    <p style="font-size: 12px; font-weight: 600; color: #64748b; margin-top: 2px;">📧 ${sanitizedEmail}</p>
                </div>

                <div style="background-color: #f8fafc; padding: 25px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #f1f5f9;">
                    <p style="text-transform: uppercase; font-size: 9px; font-weight: 900; color: #94a3b8; margin-bottom: 15px; letter-spacing: 0.1em; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Property & Quote Specs</p>
                    <p style="font-size: 14px; margin-bottom: 8px; color: #0f172a;"><strong>📍 Location:</strong> ${sanitizedAddress}, ${sanitizedCity}, RI</p>
                    <p style="font-size: 14px; color: #0f172a;"><strong>🏗️ Service:</strong> ${sanitizedService}</p>
                    ${hasMedia ? `<p style="font-size: 12px; color: #22c55e; font-weight: 900; margin-top: 15px; text-transform: uppercase; letter-spacing: 0.05em;">📸 PROPERTY VISUALS LOADED</p>` : ''}
                </div>

                ${(mediaUrls && mediaUrls.length > 0) ? `
                <div style="margin-bottom: 30px;">
                    <p style="text-transform: uppercase; font-size: 9px; font-weight: 900; color: #94a3b8; margin-bottom: 15px; letter-spacing: 0.1em;">Visual Discovery Gallery</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${mediaUrls.map((url, i) => `
                            <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 18px; background-color: #ffffff; border-radius: 10px; text-decoration: none; color: #0f172a; font-size: 11px; font-weight: 800; border: 2px solid #f1f5f9;">
                                🖼️ Open Asset #${i + 1}
                            </a>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <div style="margin-bottom: 35px;">
                    <p style="text-transform: uppercase; font-size: 9px; font-weight: 900; color: #94a3b8; margin-bottom: 10px; letter-spacing: 0.1em;">Message Context</p>
                    <div style="background-color: #f8fafc; padding: 25px; border-radius: 15px; font-style: italic; color: #334155; font-size: 14px; line-height: 1.6; border-left: 4px solid #22c55e;">
                        "${sanitizedMessage}"
                    </div>
                </div>

                <a href="mailto:${sanitizedEmail}" style="display: block; text-align: center; background-color: #0f172a; color: #ffffff; padding: 20px; border-radius: 15px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 0.1em; border-bottom: 4px solid #22c55e;">Reply to Inbound Lead</a>
            </div>
            <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #f1f5f9;">
                <p style="color: #94a3b8; font-size: 10px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">Flora Lawn CRM • Business Operations</p>
            </div>
        </div>
      `;

      console.log('📧 Sending Lead Dossier to Admin: floralawncareri@gmail.com');
      await sendEmail({
        to: 'floralawncareri@gmail.com',
        subject: `🔥 NEW LEAD: ${sanitizedName} (${sanitizedCity})`,
        text: `New Elite Lead from ${sanitizedName} for ${sanitizedService}. Address: ${sanitizedAddress}.`,
        html: adminHtml,
        replyTo: sanitizedEmail
      });

      console.log('✅ Confirmation email sent successfully via Resend:', JSON.stringify(emailResult));

      // Send SMS if opted in and phone number provided
      let smsSent = false;
      if (sendSMS && phone) {
        // Validate phone number before sending SMS
        if (validatePhone(phone)) {
          try {
            const { sendSMS: sendSMSFunction } = await import('@/libs/twilio');
            const smsMessage = `Hi ${sanitizedName}! Thank you for contacting Flora Lawn & Landscaping. We've received your inquiry about ${sanitizedService || 'your service'} and will get back to you within 1-6 hours. Reply STOP to opt-out.`;
            
            const smsResult = await sendSMSFunction(phone, smsMessage);
            console.log('✅ SMS sent successfully:', smsResult);
            smsSent = true;
          } catch (smsError) {
            console.error('❌ Error sending SMS:', smsError);
            // Don't fail the whole request if SMS fails
          }
        } else {
          console.warn('Invalid phone number for SMS:', phone);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Confirmation email sent',
        emailId: emailResult?.id,
        smsSent: smsSent
      });
    } catch (emailError) {
      console.error('❌ Error in sendEmail function:', emailError);
      throw emailError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('❌ Error sending contact confirmation email:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send confirmation email',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

