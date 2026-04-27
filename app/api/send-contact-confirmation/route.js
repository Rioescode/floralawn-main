import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { generalApiLimiter } from '@/lib/rate-limiter';
import { validateEmail, validatePhone, sanitizeText } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';

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
    
    const { email, name, service, message, phone, address, city, sendSMS, hasMedia, mediaUrls, discountApplied, cleanupData, promoCode } = body;

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
          <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn &amp; Landscaping" style="width: 180px; height: auto; margin-bottom: 15px;">
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
              <span style="color: #64748b; font-size: 12px; font-weight: 600;">Your Message:</span><br>
              <span style="color: #0f172a; font-size: 14px; font-style: italic;">&ldquo;${sanitizedMessage}&rdquo;</span>
            </div>
            ${hasMedia ? `<p style="color: #22c55e; font-size: 11px; font-weight: 900; margin-top: 15px; text-transform: uppercase;">📸 Property Visuals Received</p>` : ''}
            ${promoCode ? `
            <div style="margin-top: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 12px; text-align: center;">
              <p style="margin: 0; font-size: 9px; color: #92400e; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">🎁 Reward Applied</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 900; color: #78350f; font-style: italic;">Code: ${promoCode}</p>
            </div>
            ` : ''}
          </div>

          ${cleanupData ? `
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 24px; margin-bottom: 30px; border: 1px solid #22c55e33;">
            <p style="text-transform: uppercase; font-size: 9px; font-weight: 900; color: #22c55e; margin: 0 0 16px 0; letter-spacing: 0.15em;">🍂 Cleanup Assessment Received</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
              <tr>
                <td style="padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 8px; width: 50%; vertical-align: top;">
                  <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Last Cleaned</p>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #ffffff; font-weight: 800;">${cleanupData.lastCleaned}</p>
                </td>
                <td style="width: 12px;"></td>
                <td style="padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 8px; width: 50%; vertical-align: top;">
                  <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Condition</p>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #22c55e; font-weight: 800;">${cleanupData.conditionLevel}/5 &mdash; ${cleanupData.conditionLabel}</p>
                  <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8; font-style: italic;">${cleanupData.conditionDesc}</p>
                </td>
              </tr>
            </table>
            <div style="margin-top: 14px; height: 6px; background: #1e293b; border-radius: 99px; overflow: hidden;">
              <div style="height: 100%; width: ${cleanupData.conditionLevel * 20}%; background: linear-gradient(to right, #22c55e, ${cleanupData.conditionLevel >= 4 ? '#ef4444' : '#22c55e'}); border-radius: 99px;"></div>
            </div>
            <p style="margin: 6px 0 0 0; font-size: 9px; color: #475569; text-align: right; font-weight: 700; text-transform: uppercase;">Severity Scale 1–5</p>
          </div>
          ` : ''}

          <p style="color: #0f172a; font-size: 15px; font-weight: 800; margin-bottom: 15px;">What happens next?</p>
          <div style="color: #475569; font-size: 13px; line-height: 1.8;">
            1. 📅 <strong>Review</strong>: We'll evaluate your property measurements.<br>
            2. 📨 <strong>Delivery</strong>: You'll receive your customized quote via email.<br>
            3. 📞 <strong>Confirmation</strong>: We're available for questions at (401) 389-0913.
          </div>

          <!-- Signature Card -->
          <div style="margin-top: 36px; padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
              <tr>
                <td style="vertical-align: middle; padding-right: 20px; border-right: 1px solid #e2e8f0; width: 80px;">
                  <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn" style="width: 72px; height: 72px; object-fit: contain; display: block;">
                </td>
                <td style="vertical-align: middle; padding-left: 20px;">
                  <p style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">Rafael Escobar</p>
                  <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: 700; color: #22c55e; text-transform: uppercase; letter-spacing: 0.08em;">Owner &middot; Flora Lawn &amp; Landscaping Inc</p>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.9;">
                    📞 <a href="tel:4013890913" style="color: #64748b; text-decoration: none;">(401) 389-0913</a>&nbsp;&nbsp;
                    📧 <a href="mailto:floralawncareri@gmail.com" style="color: #64748b; text-decoration: none;">floralawncareri@gmail.com</a><br>
                    🌐 <a href="https://floralawn-and-landscaping.com" style="color: #22c55e; text-decoration: none; font-weight: 700;">floralawn-and-landscaping.com</a>&nbsp;&nbsp;
                    📍 45 Vernon St, Pawtucket, RI 02860
                  </p>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <div style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #1e293b;">
          <p style="color: #475569; font-size: 10px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">
            &copy; 2024 Flora Lawn &amp; Landscaping Inc &bull; Pawtucket, Rhode Island
          </p>
        </div>
      </div>
    `;
    
    // --- SAVE LEAD TO DATABASE ---
    try {
      console.log('📝 Saving lead to database...');
      const { error: dbError } = await supabaseAdmin.from('appointments').insert([{
        customer_name: sanitizedName,
        customer_email: sanitizedEmail,
        customer_phone: phone,
        service_type: sanitizedService,
        city: sanitizedCity,
        address: address ? `${address}, ${city}, RI` : null,
        status: 'pending',
        notes: message,
        estimate_preference: body.estimatePreference || 'walk_around',
        cleanup_last_cleaned: cleanupData?.lastCleaned || null,
        cleanup_condition_level: cleanupData?.conditionLevel || null,
        cleanup_condition_label: cleanupData?.conditionLabel || null,
        has_media: hasMedia,
        media_urls: mediaUrls,
        discount_applied: discountApplied,
        lead_source: 'contact_form',
        promo_code: promoCode || null,
        created_at: new Date().toISOString()
      }]);

      if (dbError) {
        console.warn('⚠️ Full appointment insert failed, trying base columns:', dbError.message);
        // Fallback: save with only the guaranteed base columns
        const { error: fallbackError } = await supabaseAdmin.from('appointments').insert([{
          customer_name: sanitizedName,
          customer_email: sanitizedEmail,
          customer_phone: phone,
          service_type: sanitizedService,
          city: sanitizedCity,
          status: 'pending',
          notes: `[Pref: ${body.estimatePreference || 'walk_around'}] [Source: contact_form]\n\n${message}`,
        }]);
        if (fallbackError) console.error('❌ Fallback appointment insert also failed:', fallbackError.message);
        else console.log('✅ Lead saved via fallback (base columns)');
      } else {
        console.log('✅ Lead saved to database successfully');
      }
    } catch (dbErr) {
      console.error('❌ Database save exception (appointments):', dbErr);
    }

    // --- SAVE TO EMAIL SUBSCRIBERS ---
    try {
      console.log('📝 Upserting email subscriber...');
      const { error: subError } = await supabaseAdmin.from('email_subscribers').upsert({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: phone,
        city: sanitizedCity,
        source: 'contact_form',
        preferences: { 
          email: body.emailPreferences || true, 
          sms: body.smsPreferences || { subscribe: true, notifications: true } 
        },
        subscribed_at: new Date().toISOString()
      }, { onConflict: 'email' });
      
      if (subError) console.warn('⚠️ email_subscribers upsert failed:', subError.message);
      else console.log('✅ Subscriber updated successfully');
    } catch (subErr) {
      console.warn('⚠️ email_subscribers save exception:', subErr);
    }

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
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 1px solid #f1f5f9;">

          <!-- HEADER -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 36px; border-bottom: 3px solid #22c55e; text-align: center;">
            <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn" style="width: 120px; height: auto; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;">
            <div style="display: inline-block; background: #22c55e; color: #fff; font-size: 9px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; padding: 5px 14px; border-radius: 99px; margin-bottom: 10px;">🔥 New Lead Alert</div>
            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 900; font-style: italic; letter-spacing: -0.02em;">${sanitizedName}</h1>
            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">${sanitizedService} &bull; ${sanitizedCity}, RI</p>
          </div>

          <!-- STAT CHIPS -->
          <div style="background: #f8fafc; padding: 20px 36px; border-bottom: 1px solid #e2e8f0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
              <tr>
                <td style="width: 33%; padding: 0 6px 0 0; vertical-align: top;">
                  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                    <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">📞 Phone</p>
                    <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 900; color: #22c55e;">${phone || 'Not provided'}</p>
                  </div>
                </td>
                <td style="width: 33%; padding: 0 3px; vertical-align: top;">
                  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                    <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">📍 Address</p>
                    <p style="margin: 6px 0 0 0; font-size: 12px; font-weight: 800; color: #0f172a;">${sanitizedAddress}</p>
                  </div>
                </td>
                <td style="width: 33%; padding: 0 0 0 6px; vertical-align: top;">
                  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                    <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">📧 Email</p>
                    <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; color: #475569; word-break: break-all;">${sanitizedEmail}</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- BODY -->
          <div style="padding: 32px 36px; background: #ffffff;">

            ${discountApplied ? `
            <div style="background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
              <p style="margin: 0; color: #166534; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">💎 10% Visual Quote Credit Active</p>
            </div>
            ` : ''}

            ${promoCode ? `
            <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
              <p style="margin: 0; color: #92400e; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">🎁 PROMO CLAIMED: ${promoCode}</p>
              <p style="margin: 4px 0 0 0; color: #78350f; font-size: 10px; font-weight: 700;">Applied via Seasonal Offers Page</p>
            </div>
            ` : ''}

            <!-- SERVICE ROW -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #22c55e; border-radius: 0 16px 16px 0; padding: 18px 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 4px 0; font-size: 9px; color: #94a3b8; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">🏗️ Service Requested</p>
              <p style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; font-style: italic;">${sanitizedService}</p>
            </div>

            ${cleanupData ? `
            <!-- CLEANUP ASSESSMENT -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 14px 0; font-size: 9px; color: #22c55e; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">🍂 Cleanup Assessment</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                <tr>
                  <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
                      <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">Last Cleaned</p>
                      <p style="margin: 6px 0 0 0; font-size: 15px; font-weight: 900; color: #0f172a;">${cleanupData.lastCleaned}</p>
                    </div>
                  </td>
                  <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
                      <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">Condition</p>
                      <p style="margin: 6px 0 0 0; font-size: 15px; font-weight: 900; color: #22c55e;">${cleanupData.conditionLevel}/5 &mdash; ${cleanupData.conditionLabel}</p>
                      <p style="margin: 3px 0 0 0; font-size: 11px; color: #64748b; font-style: italic;">${cleanupData.conditionDesc}</p>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 14px; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                <div style="height: 100%; width: ${cleanupData.conditionLevel * 20}%; background: linear-gradient(to right, #22c55e, ${cleanupData.conditionLevel >= 4 ? '#ef4444' : '#22c55e'}); border-radius: 99px;"></div>
              </div>
              <p style="margin: 5px 0 0 0; font-size: 9px; color: #94a3b8; text-align: right; font-weight: 700; text-transform: uppercase;">Severity ${cleanupData.conditionLevel}/5</p>
            </div>
            ` : ''}

            <!-- MESSAGE -->
            <div style="margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; font-size: 9px; color: #94a3b8; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">💬 Customer Message</p>
              <div style="background: #f8fafc; border-left: 4px solid #22c55e; border-radius: 0 12px 12px 0; padding: 18px 20px; font-size: 14px; color: #334155; line-height: 1.7; font-style: italic;">
                &ldquo;${sanitizedMessage || 'No message provided.'}&rdquo;
              </div>
            </div>

            ${(mediaUrls && mediaUrls.length > 0) ? `
            <!-- MEDIA GALLERY -->
            <div style="margin-bottom: 24px;">
              <p style="margin: 0 0 12px 0; font-size: 9px; color: #94a3b8; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">📸 Property Visuals (${mediaUrls.length})</p>
              <div>
                ${mediaUrls.map((url, i) => `
                <a href="${url}" target="_blank" style="display: inline-block; margin: 0 8px 8px 0; padding: 10px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; text-decoration: none; color: #0f172a; font-size: 11px; font-weight: 800;">
                  🖼️ Photo ${i + 1}
                </a>`).join('')}
              </div>
            </div>
            ` : ''}

            <!-- CTA BUTTONS -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin-top: 8px;">
              <tr>
                <td style="padding-right: 8px; width: 50%;">
                  <a href="mailto:${sanitizedEmail}" style="display: block; text-align: center; background: #22c55e; color: #ffffff; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">
                    📧 Reply by Email
                  </a>
                </td>
                <td style="padding-left: 8px; width: 50%;">
                  <a href="tel:${phone || ''}" style="display: block; text-align: center; background: #0f172a; color: #ffffff; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">
                    📞 Call Lead
                  </a>
                </td>
              </tr>
            </table>
          </div>

          <!-- FOOTER -->
          <div style="background: #0f172a; padding: 18px 36px; text-align: center; border-top: 1px solid #1e293b;">
            <p style="margin: 0; color: #475569; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Flora Lawn CRM &bull; Lead Received ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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

