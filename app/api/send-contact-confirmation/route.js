import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { generalApiLimiter } from '@/lib/rate-limiter';
import { validateEmail, validatePhone, sanitizeText } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import {
  emailLayout,
  heading,
  paragraph,
  section,
  detailsTable,
  chips,
  callout,
  quote,
  steps,
  signature,
  button,
  buttonRow,
  escapeHtml,
  parseLeadMessage,
  leadSections,
  siteUrl,
} from '@/libs/email-template';

function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

function digitsOnly(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function estimateLabel(value) {
  return value === 'meet_person' ? 'Meet in person' : 'Walk around and email pricing';
}

function plainSummary(parsed) {
  return parsed.sections
    .map((block) => `${block.title}\n${block.rows.map((row) => (row.label ? `- ${row.label}: ${row.value}` : `- ${row.value}`)).join('\n')}`)
    .join('\n\n');
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
    
    const { email, name, service, message, phone, address, city, state, zipCode, sendSMS, hasMedia, mediaUrls, discountApplied, cleanupData, promoCode } = body;

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
    const sanitizedService = sanitizeText(service || '', 200);
    const sanitizedMessage = sanitizeText(message || '', 5000);
    const sanitizedAddress = sanitizeText(address || 'Not Provided', 200);
    const sanitizedCity = sanitizeText(city || '', 100);
    const sanitizedState = sanitizeText(state || 'RI', 50);
    const sanitizedZip = sanitizeText(zipCode || '', 20);

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

    const parsed = parseLeadMessage(sanitizedMessage);
    const serviceList = parsed.services.length
      ? parsed.services
      : sanitizedService.split(',').map((item) => item.trim()).filter(Boolean);
    const serviceText = serviceList.join(', ') || 'Yard service';
    const firstName = sanitizedName.split(' ')[0];
    const placeLine = [sanitizedCity, sanitizedState].filter(Boolean).join(', ');
    const photoCount = Array.isArray(mediaUrls) ? mediaUrls.length : 0;

    const customerBody = [
      heading(`Thanks, ${firstName}. We got your request.`, 'We reply with your price in 1 to 6 hours.'),
      section('What you asked for', chips(serviceList)),
      leadSections(parsed, { skip: ['Estimate style'] }),
      parsed.note ? section('Your note', quote(parsed.note)) : '',
      discountApplied ? callout('<strong>10% photo credit applied.</strong> Thanks for sending pictures of the property.') : '',
      promoCode ? callout(`<strong>Code ${escapeHtml(promoCode)} is on this quote.</strong> We apply it to the price we send.`, 'gold') : '',
      hasMedia && !discountApplied ? callout(`We received ${photoCount || 'your'} photo${photoCount === 1 ? '' : 's'} of the property.`) : '',
      section('What happens next', steps([
        '<strong>We review the property</strong> using your answers above and satellite photos.',
        '<strong>You get the price by email</strong>, usually within 1 to 6 hours.',
        '<strong>Pick a day</strong> that works and we put you on the schedule.',
      ])),
      callout(
        `<strong>See this quote in your account.</strong><br>Sign in with Google to see when it is ready, change the date, or skip a visit.<br>${button(siteUrl('/login?redirect=/customer/dashboard'), 'Open your yard account')}`,
        'navy'
      ),
      paragraph('Questions before then? Reply to this email or call <a href="tel:4013890913" style="color:#2F6B4F;font-weight:700;">(401) 389-0913</a>.'),
      signature(),
    ].join('');

    const emailHtml = emailLayout({
      preheader: `We got your request for ${serviceText}. Your price arrives in 1 to 6 hours.`,
      body: customerBody,
    });
    
    // --- SAVE LEAD TO DATABASE ---
    if (body.leadId) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('contact_leads')
        .update({
          service_type: sanitizedService,
          address: address || null,
          notes: sanitizedMessage,
          customer_phone: phone || null,
        })
        .eq('id', body.leadId)
        .eq('customer_email', sanitizedEmail)
        .select('id')
        .maybeSingle();

      if (updateError || !updated) {
        return NextResponse.json({ error: 'Could not update that quote.' }, { status: 400 });
      }

      return NextResponse.json({ success: true, leadId: updated.id, updated: true, message: 'Quote updated' });
    }

    let savedLeadId = null;
    try {
      console.log('📝 Saving lead to database...');
      const { data: inserted, error: dbError } = await supabaseAdmin.from('contact_leads').insert([{
        customer_name: sanitizedName,
        customer_email: sanitizedEmail,
        customer_phone: phone,
        service_type: sanitizedService,
        city: sanitizedCity,
        address: address ? `${address}${sanitizedState ? `, ${sanitizedState}` : ''}${sanitizedZip ? ` ${sanitizedZip}` : ''}` : null,
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
      }]).select('id').maybeSingle();

      if (!dbError && inserted?.id) savedLeadId = inserted.id;

      if (dbError) {
        console.warn('⚠️ Full contact_leads insert failed, trying base columns:', dbError.message);
        // Fallback: save with only the guaranteed base columns
        const { data: fallbackRow, error: fallbackError } = await supabaseAdmin.from('contact_leads').insert([{
          customer_name: sanitizedName,
          customer_email: sanitizedEmail,
          customer_phone: phone,
          service_type: sanitizedService,
          city: sanitizedCity,
          status: 'pending',
          notes: `[Pref: ${body.estimatePreference || 'walk_around'}] [Source: contact_form]\n\n${message}`,
        }]).select('id').maybeSingle();
        if (fallbackError) console.error('❌ Fallback lead insert also failed:', fallbackError.message);
        else {
          if (fallbackRow?.id) savedLeadId = fallbackRow.id;
          console.log('✅ Lead saved via fallback (base columns)');
        }
      } else {
        console.log('✅ Lead saved to contact_leads successfully');
      }
    } catch (dbErr) {
      console.error('❌ Database save exception (leads):', dbErr);
    }

    // --- SAVE TO COMMUNICATION PREFERENCES (10DLC AUDIT TRAIL) ---
    try {
      console.log('📝 Upserting into communication_preferences for audit trail...');
      // Extract boolean values directly since the frontend passes them in a nested object sometimes
      const emailConsent = body.emailPreferences?.subscribe === true || body.emailPreferences === true;
      const smsConsent = body.smsPreferences?.subscribe === true || body.sendSMS === true;

      const { error: commError } = await supabaseAdmin.from('communication_preferences').upsert({
        email: sanitizedEmail,
        phone: phone || null,
        first_name: sanitizedName.split(' ')[0] || null,
        last_name: sanitizedName.split(' ').slice(1).join(' ') || null,
        email_consent: emailConsent,
        sms_consent: smsConsent,
        opt_in_source: 'contact_form',
        ip_address: clientIP,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });
      
      if (commError) {
        console.warn('⚠️ communication_preferences upsert failed (Did you run the SQL?):', commError.message);
      } else {
        console.log('✅ Communication preferences audit trail saved');
      }
    } catch (commErr) {
      console.warn('⚠️ communication_preferences save exception:', commErr);
    }

    // --- SAVE TO EMAIL SUBSCRIBERS (LEGACY SUPPORT) ---
    try {
      console.log('📝 Upserting email subscriber...');
      const { error: subError } = await supabaseAdmin.from('email_subscribers').upsert({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: phone,
        city: sanitizedCity,
        source: 'contact_form',
        preferences: { 
          email: body.emailPreferences?.subscribe ?? true, 
          sms: body.smsPreferences?.subscribe ?? true 
        },
        subscribed_at: new Date().toISOString()
      }, { onConflict: 'email' });
      
      if (subError) console.warn('⚠️ email_subscribers upsert failed:', subError.message);
      else console.log('✅ Subscriber updated successfully');
    } catch (subErr) {
      console.warn('⚠️ email_subscribers save exception:', subErr);
    }

    console.log('📧 Sending confirmation email via Resend to:', sanitizedEmail);
    
    try {
      const customerEmailResult = await sendEmail({
        to: sanitizedEmail,
        subject: `We got your request: ${serviceText}`,
        text: [
          `Thanks, ${firstName}. We got your request for ${serviceText}.`,
          'We reply with your price in 1 to 6 hours.',
          plainSummary(parsed),
          parsed.note ? `Your note:\n${parsed.note}` : '',
          `See this quote in your account: ${siteUrl('/login?redirect=/customer/dashboard')}`,
          'Questions? Call (401) 389-0913.',
        ].filter(Boolean).join('\n\n'),
        html: emailHtml,
        replyTo: 'floralawncareri@gmail.com',
        recipientName: sanitizedName,
      });

      // --- ADMIN LEAD ALERT ---
      const phoneDigits = digitsOnly(phone);
      const fullAddress = [sanitizedAddress !== 'Not Provided' ? sanitizedAddress : '', sanitizedAddress.includes(sanitizedCity) ? '' : placeLine]
        .filter(Boolean)
        .join(', ');
      const mapHref = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : '';
      const received = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      const photos = photoCount
        ? `<div>${mediaUrls
            .slice(0, 6)
            .map(
              (url, i) =>
                `<a href="${escapeHtml(url)}" style="display:inline-block;margin:0 8px 8px 0;text-decoration:none;"><img src="${escapeHtml(url)}" alt="Photo ${i + 1}" width="120" height="90" style="display:block;width:120px;height:90px;object-fit:cover;border:1px solid #DDE5DF;"></a>`
            )
            .join('')}</div>${photoCount > 6 ? `<p style="margin:4px 0 0 0;font-size:13px;color:#5C6B62;">${photoCount - 6} more in the lead record.</p>` : ''}`
        : '';

      const adminBody = [
        `<p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#991B1B;">New lead &middot; ${escapeHtml(received)}</p>`,
        heading(sanitizedName, escapeHtml(fullAddress || placeLine || 'No address given')),
        chips(serviceList),
        buttonRow([
          phoneDigits ? button(`tel:${phoneDigits}`, 'Call', 'primary') : '',
          phoneDigits ? button(`sms:${phoneDigits}`, 'Text', 'dark') : '',
          button(`mailto:${sanitizedEmail}`, 'Email', 'outline'),
          mapHref ? button(mapHref, 'Map', 'outline') : '',
        ]),
        section('Contact', detailsTable([
          { label: 'Phone', value: phone || 'Not provided' },
          { label: 'Email', value: sanitizedEmail },
          { label: 'Address', value: fullAddress || 'Not provided' },
          { label: 'Estimate', value: estimateLabel(body.estimatePreference) },
        ])),
        leadSections(parsed),
        cleanupData?.conditionLevel
          ? section('Leaf cover', `<div style="height:8px;background:#DDE5DF;"><div style="height:8px;width:${Math.min(5, Number(cleanupData.conditionLevel)) * 20}%;background:${Number(cleanupData.conditionLevel) >= 4 ? '#991B1B' : '#2F6B4F'};"></div></div><p style="margin:6px 0 0 0;font-size:13px;color:#5C6B62;">${escapeHtml(cleanupData.conditionLevel)}/5 &middot; ${escapeHtml(cleanupData.conditionLabel || '')}</p>`)
          : '',
        parsed.note ? section('Customer note', quote(parsed.note)) : '',
        photos ? section(`Photos (${photoCount})`, photos) : '',
        discountApplied ? callout('<strong>10% photo credit</strong> is on this lead.') : '',
        promoCode ? callout(`<strong>Promo code: ${escapeHtml(promoCode)}</strong>`, 'gold') : '',
        buttonRow([button(siteUrl('/leads'), 'Open in leads', 'gold')]),
      ].join('');

      const adminHtml = emailLayout({
        preheader: `${sanitizedName} wants ${serviceText}${placeLine ? ` in ${placeLine}` : ''}.`,
        body: adminBody,
        footerNote: 'Reply to this email to answer the customer directly.',
      });

      console.log('📧 Sending lead alert to admin');
      await sendEmail({
        to: 'floralawncareri@gmail.com',
        subject: `New lead: ${sanitizedName} · ${serviceText}${sanitizedCity ? ` · ${sanitizedCity}` : ''}`,
        text: [
          `New lead: ${sanitizedName}`,
          `Services: ${serviceText}`,
          `Phone: ${phone || 'Not provided'}`,
          `Email: ${sanitizedEmail}`,
          `Address: ${fullAddress || 'Not provided'}`,
          `Estimate: ${estimateLabel(body.estimatePreference)}`,
          plainSummary(parsed),
          parsed.note ? `Customer note:\n${parsed.note}` : '',
        ].filter(Boolean).join('\n'),
        html: adminHtml,
        replyTo: sanitizedEmail,
        type: 'LEAD',
        recipientName: 'Admin',
      });

      console.log('✅ Confirmation email sent successfully via Resend:', JSON.stringify(customerEmailResult));

      // Send SMS if opted in and phone number provided
      let smsSent = false;
      if (sendSMS && phone) {
        // Validate phone number before sending SMS
        if (validatePhone(phone)) {
          try {
            const { sendSMS: sendSMSFunction } = await import('@/libs/twilio');
            const smsMessage = `Flora Lawn: We received your quote request for ${serviceText}. Our team is reviewing it now. Reply STOP to opt-out. Msg&Data rates apply.`;
            
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
        emailId: customerEmailResult?.id,
        smsSent: smsSent,
        leadId: savedLeadId
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
