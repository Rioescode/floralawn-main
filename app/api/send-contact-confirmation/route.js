import { NextResponse } from 'next/server';
import fs from 'fs/promises';
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
import { forwardConsentedFloraLead } from '@/libs/mgr-partner-lead';
import { contactLeadIntakePayload, sendToMgr } from '@/libs/mgr-crew-intake';
import { BACKUP_REFERRAL_CONSENT_TEXT } from '@/lib/backup-referral-consent';
import { isSameOrigin, overLimit, headerSafe, honeypotTripped, tooFast, spamReason, silentDrop, rejectJson } from '@/lib/spam-guard';
import { turnstileActive, verifyTurnstile } from '@/lib/turnstile';

function isEmailDryRun() {
  return process.env.EMAIL_DRY_RUN === '1';
}

// Writes the same payload Resend would send, and does not call Resend.
async function deliverEmail(payload) {
  if (!isEmailDryRun()) return sendEmail(payload);
  const dir = '/tmp/contact-lead-dry-run';
  await fs.mkdir(dir, { recursive: true });
  const file = payload.type === 'LEAD' ? 'owner.json' : 'customer.json';
  await fs.writeFile(`${dir}/${file}`, JSON.stringify({
    to: payload.to,
    subject: payload.subject,
    replyTo: payload.replyTo || '',
    text: payload.text,
    type: payload.type || '',
  }, null, 2));
  console.log(`EMAIL_DRY_RUN: wrote ${file} (${payload.subject})`);
  return { id: `dry-run-${file}` };
}

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

function queueCrewLead(record) {
  if (record == null || record.id == null || record.id === '') return Promise.resolve();
  return sendToMgr(contactLeadIntakePayload(record)).catch(() => {});
}

function yardSizeFromParsed(parsed) {
  const sections = parsed && Array.isArray(parsed.sections) ? parsed.sections : [];
  for (const block of sections) {
    const rows = block && Array.isArray(block.rows) ? block.rows : [];
    for (const row of rows) {
      if (String((row && row.label) || '').trim().toLowerCase() !== 'yard size') continue;
      const value = String((row && row.value) || '').trim();
      if (value) return value;
    }
  }
  return '';
}

export async function POST(request) {
  let pendingForwards = Promise.resolve();
  try {
    // Rate limiting check (30 requests per minute per IP)
    const rateLimitResult = await generalApiLimiter(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    // Get client IP for logging
    const clientIP = getClientIP(request);

    // Only accept posts that come from a page on this site. Bots that post
    // straight to this endpoint used to get through because this was log-only.
    if (!isSameOrigin(request)) {
      console.warn(`Contact form blocked: foreign or missing origin from ${clientIP}`);
      return rejectJson('Please send this form from our website.', 403);
    }

    // 5 submissions per 10 minutes per IP on top of the general limiter.
    if (overLimit(`contact-ip:${clientIP}`, 5, 10 * 60 * 1000)) {
      return rejectJson('Too many requests. Please wait a few minutes or call (401) 205-3853.', 429);
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
    
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return rejectJson('Invalid request body');
    }
    const { email, name, service, message, phone, address, city, state, zipCode, sendSMS, hasMedia, mediaUrls, discountApplied, cleanupData, promoCode, partnerBackupConsent } = body;

    // Quote updates come from signed-in customers editing a saved quote and
    // must match the lead's email, so the bot checks below apply to new leads.
    const isQuoteUpdate = Boolean(body.leadId);
    if (honeypotTripped(body)) return silentDrop('honeypot', request);
    if (!isQuoteUpdate && tooFast(body)) return silentDrop('too fast or no timing', request);
    if (turnstileActive()) {
      const turnstile = await verifyTurnstile(body.turnstileToken, clientIP);
      if (!turnstile.ok) return rejectJson(turnstile.error);
    }

    const rawLeadSource = typeof body.leadSource === 'string' ? body.leadSource : '';
    const leadSource = /^[a-z0-9_]{1,40}$/.test(rawLeadSource) ? rawLeadSource : 'contact_form';

    const partnerBackupRequested = Boolean(
      partnerBackupConsent === true ||
      partnerBackupConsent === 'true' ||
      body.partnerReferralConsent === true ||
      body.partnerReferralConsent === 'true'
    );

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
    const sanitizedName = headerSafe(sanitizeText(name, 100), 100);
    const sanitizedService = headerSafe(sanitizeText(service || '', 200), 200);
    const sanitizedMessage = sanitizeText(message || '', 5000);
    const sanitizedAddress = sanitizeText(address || 'Not Provided', 200);
    const sanitizedCity = headerSafe(sanitizeText(city || '', 100), 100);
    const sanitizedState = sanitizeText(state || 'RI', 50);
    const sanitizedZip = sanitizeText(zipCode || '', 20);

    // Additional validation
    if (sanitizedName.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    if (sanitizedEmail.length > 254) {
      return NextResponse.json({ error: 'Email address is too long' }, { status: 400 });
    }

    if (phone != null && phone !== '') {
      const phoneDigitCount = digitsOnly(phone).length;
      if (typeof phone !== 'string' || phone.length > 30 || phoneDigitCount < 7 || phoneDigitCount > 15) {
        return rejectJson('Please enter a valid phone number.');
      }
    }

    if (!isQuoteUpdate) {
      const spam = spamReason({
        name: sanitizedName,
        message: sanitizedMessage,
        extra: `${sanitizedAddress} ${sanitizedCity} ${sanitizedService}`,
      });
      if (spam) {
        console.warn(`Contact form flagged (${spam}) from ${clientIP}`);
        return rejectJson('Our spam filter stopped this message. Please remove any links and try again, or call (401) 205-3853.');
      }
      // Stops the form from being used to flood one inbox with confirmations.
      if (overLimit(`contact-email:${sanitizedEmail}`, 3, 60 * 60 * 1000)) {
        return rejectJson('We already got several requests from this email. We will reply soon, or call (401) 205-3853.', 429);
      }
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

    const partnerBackupSection = partnerBackupRequested
      ? section(
          'Backup Coverage Assistance · What to Expect',
          `<div style="background:#F4F8F5;border:1px solid #D5E5DA;border-left:4px solid #2F6B4F;padding:16px 18px;margin-top:6px;">
            <p style="margin:0 0 10px 0;font-size:14px;color:#1B2838;line-height:1.5;">
              <strong>You selected our Backup Coverage option.</strong> If Flora Lawn's schedule is fully booked or outside our route for your requested date, here is how we ensure your property gets taken care of without delay:
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:28px;vertical-align:top;padding:4px 0;">
                  <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;background:#2F6B4F;color:#ffffff;font-size:11px;font-weight:700;border-radius:50%;">1</span>
                </td>
                <td style="padding:4px 0 8px 0;vertical-align:top;font-size:13.5px;color:#1B2838;line-height:1.5;">
                  <strong>Flora Lawn reviews first:</strong> Our direct team reviews your property and route availability first. If we have an opening, you will receive our direct quote and scheduling.
                </td>
              </tr>
              <tr>
                <td style="width:28px;vertical-align:top;padding:4px 0;">
                  <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;background:#2F6B4F;color:#ffffff;font-size:11px;font-weight:700;border-radius:50%;">2</span>
                </td>
                <td style="padding:4px 0 8px 0;vertical-align:top;font-size:13.5px;color:#1B2838;line-height:1.5;">
                  <strong>Partner Referral:</strong> If our calendar is at capacity, we introduce your request to an independent local lawn care partner in Rhode Island or Southern Massachusetts from our network.
                </td>
              </tr>
              <tr>
                <td style="width:28px;vertical-align:top;padding:4px 0;">
                  <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;background:#2F6B4F;color:#ffffff;font-size:11px;font-weight:700;border-radius:50%;">3</span>
                </td>
                <td style="padding:4px 0 8px 0;vertical-align:top;font-size:13.5px;color:#1B2838;line-height:1.5;">
                  <strong>Direct Introduction &amp; Pricing:</strong> The matched partner contacts you directly by phone, SMS, or email with their estimate and booking availability.
                </td>
              </tr>
              <tr>
                <td style="width:28px;vertical-align:top;padding:4px 0;">
                  <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;background:#2F6B4F;color:#ffffff;font-size:11px;font-weight:700;border-radius:50%;">4</span>
                </td>
                <td style="padding:4px 0 0 0;vertical-align:top;font-size:13.5px;color:#1B2838;line-height:1.5;">
                  <strong>100% Free &amp; Zero Obligation:</strong> There are never any referral fees or surcharges to you, and you are under no obligation to accept the quote.
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0 0;font-size:12px;color:#5C6B62;border-top:1px dashed #DDE5DF;padding-top:10px;line-height:1.5;">
              <em>Prefer Flora Lawn direct only?</em> If you prefer not to connect with a partner and would rather wait for an opening with our team, simply reply to this email or call <a href="tel:4012053853" style="color:#2F6B4F;font-weight:700;text-decoration:none;">(401) 205-3853</a>.
            </p>
          </div>`
        )
      : '';

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
      partnerBackupSection,
      callout(
        `<strong>See this quote in your account.</strong><br>Sign in with Google to see when it is ready, change the date, or skip a visit.<br>${button(siteUrl('/login?redirect=/customer/dashboard'), 'Open your yard account')}`,
        'navy'
      ),
      paragraph('Questions before then? Reply to this email or call <a href="tel:4012053853" style="color:#2F6B4F;font-weight:700;">(401) 205-3853</a>.'),
      signature(),
    ].filter(Boolean).join('');

    const emailHtml = emailLayout({
      preheader: `We got your request for ${serviceText}. Your price arrives in 1 to 6 hours.`,
      body: customerBody,
    });
    
    // --- SAVE LEAD TO DATABASE ---
    if (body.leadId) {
      if (isEmailDryRun()) {
        console.log('EMAIL_DRY_RUN: skipped contact_leads update');
        return NextResponse.json({ success: true, leadId: body.leadId, updated: true, message: 'Quote updated' });
      }
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

      pendingForwards = queueCrewLead({
        id: updated.id,
        customer_name: sanitizedName,
        customer_email: sanitizedEmail,
        customer_phone: phone || '',
        address: address || '',
        city: sanitizedCity,
        service_type: sanitizedService || (serviceList.length ? serviceList.join(', ') : ''),
        notes: sanitizedMessage,
      });
      return NextResponse.json({ success: true, leadId: updated.id, updated: true, message: 'Quote updated' });
    }

    let savedLeadId = null;
    if (isEmailDryRun()) {
      console.log('EMAIL_DRY_RUN: skipped contact_leads insert');
    } else try {
      console.log('📝 Saving lead to database...');
      const { data: inserted, error: dbError } = await supabaseAdmin.from('contact_leads').insert([{
        customer_name: sanitizedName,
        customer_email: sanitizedEmail,
        customer_phone: phone,
        service_type: sanitizedService,
        city: sanitizedCity,
        address: address ? `${address}${sanitizedState ? `, ${sanitizedState}` : ''}${sanitizedZip ? ` ${sanitizedZip}` : ''}` : null,
        status: 'pending',
        notes: `${message}${partnerBackupRequested ? '\n\n[PARTNER REFERRAL: CONSENTED - OK to dispatch to partner if booked]' : '\n\n[PARTNER REFERRAL: DECLINED - Direct Flora Lawn only]'}`,
        estimate_preference: body.estimatePreference || 'walk_around',
        cleanup_last_cleaned: cleanupData?.lastCleaned || null,
        cleanup_condition_level: cleanupData?.conditionLevel || null,
        cleanup_condition_label: cleanupData?.conditionLabel || null,
        has_media: hasMedia,
        media_urls: mediaUrls,
        discount_applied: discountApplied,
        lead_source: leadSource,
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
          notes: `[Pref: ${body.estimatePreference || 'walk_around'}] [Partner Backup: ${partnerBackupRequested ? 'YES' : 'NO'}] [Source: ${leadSource}]\n\n${message}`,
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

    // After a successful insert only. Consent is the request flag
    // partnerBackupConsent (also accepted as partnerReferralConsent). There is
    // no contact_leads column for it. A partner-forward failure must not
    // change the form response.
    const forwards = [];
    if (savedLeadId && partnerBackupRequested) {
      const yardSize = yardSizeFromParsed(parsed);
      const jobs = (Array.isArray(serviceList) ? serviceList : [])
        .map((item) => String(item || '').trim())
        .filter(Boolean);
      const partnerPhone = typeof phone === 'string' ? phone.trim() : phone ? String(phone).trim() : '';
      forwards.push(forwardConsentedFloraLead({
        source: 'flora',
        external_id: savedLeadId,
        name: sanitizedName,
        email: sanitizedEmail,
        phone: partnerPhone,
        address: sanitizeText(typeof address === 'string' ? address : '', 500),
        town: sanitizedCity,
        jobs,
        ...(yardSize ? { size: yardSize } : {}),
        notes: sanitizedMessage,
        consent_backup_referral: true,
        consent_text: BACKUP_REFERRAL_CONSENT_TEXT,
        submitted_at: new Date().toISOString(),
      }).catch(() => {}));
    }
    if (savedLeadId) {
      const composedAddress = address
        ? `${address}${sanitizedState ? `, ${sanitizedState}` : ''}${sanitizedZip ? ` ${sanitizedZip}` : ''}`
        : '';
      forwards.push(queueCrewLead({
        id: savedLeadId,
        customer_name: sanitizedName,
        customer_email: sanitizedEmail,
        customer_phone: phone || '',
        address: composedAddress,
        city: sanitizedCity,
        service_type: sanitizedService || (serviceList.length ? serviceList.join(', ') : ''),
        notes: `${sanitizedMessage}${partnerBackupRequested ? '\n\n[PARTNER REFERRAL: CONSENTED - OK to dispatch to partner if booked]' : '\n\n[PARTNER REFERRAL: DECLINED - Direct Flora Lawn only]'}`,
        status: 'pending',
      }));
    }
    pendingForwards = Promise.all(forwards);

    // --- SAVE TO COMMUNICATION PREFERENCES (10DLC AUDIT TRAIL) ---
    if (!isEmailDryRun()) try {
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
        opt_in_source: leadSource,
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
    if (!isEmailDryRun()) try {
      console.log('📝 Upserting email subscriber...');
      const { error: subError } = await supabaseAdmin.from('email_subscribers').upsert({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: phone,
        city: sanitizedCity,
        source: leadSource,
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
      const customerEmailResult = await deliverEmail({
        to: sanitizedEmail,
        subject: `We got your request: ${headerSafe(serviceText, 150)}`,
        text: [
          `Thanks, ${firstName}. We got your request for ${serviceText}.`,
          'We reply with your price in 1 to 6 hours.',
          plainSummary(parsed),
          parsed.note ? `Your note:\n${parsed.note}` : '',
          partnerBackupRequested
            ? [
                'BACKUP COVERAGE ASSISTANCE (ACTIVE):',
                'You opted in for backup coverage assistance. If Flora Lawn is fully booked for your requested date:',
                '1. Flora Lawn evaluates your property first for direct service.',
                '2. If at capacity, we connect you with an independent local partner in RI / Southern MA.',
                '3. The partner reaches out directly with their estimate and schedule.',
                '4. 100% free with zero obligation to accept.',
                'Prefer Flora Lawn only? Reply to this email or call (401) 205-3853.',
              ].join('\n')
            : '',
          `See this quote in your account: ${siteUrl('/login?redirect=/customer/dashboard')}`,
          'Questions? Call (401) 205-3853.',
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
          { label: 'Partner Backup', value: partnerBackupRequested ? 'YES — Consented to partner referral if booked' : 'NO — Flora Lawn direct crew only' },
        ])),
        leadSections(parsed),
        cleanupData?.conditionLevel
          ? section('Leaf cover', `<div style="height:8px;background:#DDE5DF;"><div style="height:8px;width:${Math.min(5, Number(cleanupData.conditionLevel)) * 20}%;background:${Number(cleanupData.conditionLevel) >= 4 ? '#991B1B' : '#2F6B4F'};"></div></div><p style="margin:6px 0 0 0;font-size:13px;color:#5C6B62;">${escapeHtml(cleanupData.conditionLevel)}/5 &middot; ${escapeHtml(cleanupData.conditionLabel || '')}</p>`)
          : '',
        parsed.note ? section('Customer note', quote(parsed.note)) : '',
        photos ? section(`Photos (${photoCount})`, photos) : '',
        discountApplied ? callout('<strong>10% photo credit</strong> is on this lead.') : '',
        promoCode ? callout(`<strong>Promo code: ${escapeHtml(promoCode)}</strong>`, 'gold') : '',
        partnerBackupRequested
          ? callout('<strong>🤝 Partner Backup Referral: YES</strong><br>Customer agreed to connect with an independent local partner if Flora Lawn is booked or unavailable. Safe to dispatch via Crew Desk / MyGreenRobot network if needed.', 'gold')
          : '',
        buttonRow([button(siteUrl('/leads'), 'Open in leads', 'gold')]),
      ].join('');

      const adminHtml = emailLayout({
        preheader: `${sanitizedName} wants ${serviceText}${placeLine ? ` in ${placeLine}` : ''}.`,
        body: adminBody,
        footerNote: 'Reply to this email to answer the customer directly.',
      });

      console.log('📧 Sending lead alert to admin');
      await deliverEmail({
        to: 'floralawncareri@gmail.com',
        subject: headerSafe(`New lead: ${sanitizedName} · ${serviceText}${sanitizedCity ? ` · ${sanitizedCity}` : ''}`, 200),
        text: [
          `New lead: ${sanitizedName}`,
          `Services: ${serviceText}`,
          `Phone: ${phone || 'Not provided'}`,
          `Email: ${sanitizedEmail}`,
          `Address: ${fullAddress || 'Not provided'}`,
          `Estimate: ${estimateLabel(body.estimatePreference)}`,
          `Partner Backup: ${partnerBackupRequested ? 'YES (Consented to partner referral)' : 'NO (Direct only)'}`,
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
      if (sendSMS && phone && !isEmailDryRun()) {
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
  } finally {
    try {
      await pendingForwards;
    } catch {
      // Crew intake and partner forwarding must not change the form response.
    }
  }
}
