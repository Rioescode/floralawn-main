import { NextResponse } from "next/server";
import { sendEmail } from "@/libs/resend";
import { emailLayout, heading, chips, button, buttonRow, section, detailsTable, escapeHtml } from "@/libs/email-template";
import { validateEmail } from "@/lib/validation";
import { clientIp, isSameOrigin, overLimit, headerSafe, honeypotTripped, tooFast, spamReason, silentDrop, rejectJson } from "@/lib/spam-guard";

// This route receives lead data and sends an email notification using Resend
export async function POST(req) {
  try {
    if (!isSameOrigin(req)) {
      return rejectJson("Please send this form from our website.", 403);
    }
    if (overLimit(`lead-ip:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
      return rejectJson("Too many requests. Please wait a few minutes.", 429);
    }

    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return rejectJson("Invalid request body");
    }
    if (honeypotTripped(body)) return silentDrop("honeypot", req);
    if (tooFast(body)) return silentDrop("too fast or no timing", req);

    if (!body.email || typeof body.email !== "string" || !validateEmail(body.email.trim())) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    body.email = body.email.trim().slice(0, 254);
    body.name = headerSafe(typeof body.name === "string" ? body.name : "", 100);
    body.phone = headerSafe(typeof body.phone === "string" ? body.phone : "", 30);
    body.address = typeof body.address === "string" ? body.address.slice(0, 300) : "";
    body.price = Number(body.price) || 0;
    body.sqft = Number(body.sqft) || 0;
    const spam = spamReason({ name: body.name, message: typeof body.notes === "string" ? body.notes : "", extra: body.address });
    if (spam) {
      console.warn(`Instant quote lead flagged (${spam})`);
      return rejectJson("Our spam filter stopped this message. Please remove any links and try again.");
    }

    const services = Array.isArray(body.services) ? body.services : [];
    const phoneDigits = String(body.phone || '').replace(/\D/g, '');
    const htmlContent = emailLayout({
      preheader: `${body.name || 'Website user'} measured ${body.sqft ? body.sqft.toLocaleString() : 0} sq ft. Estimate $${body.price ? body.price.toLocaleString() : 0}.`,
      footerNote: 'Lead from the Auto Lawn measuring tool. Reply to answer the customer.',
      body: [
        '<p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#991B1B;">New lead &middot; Auto Lawn tool</p>',
        heading(body.name || 'Website user', escapeHtml(body.address || 'No address given')),
        chips(services.map((s) => s.name)),
        buttonRow([
          phoneDigits ? button(`tel:${phoneDigits}`, 'Call', 'primary') : '',
          phoneDigits ? button(`sms:${phoneDigits}`, 'Text', 'dark') : '',
          button(`mailto:${encodeURIComponent(body.email)}`, 'Email', 'outline'),
        ]),
        section('Contact', detailsTable([
          { label: 'Phone', value: body.phone || 'Not provided' },
          { label: 'Email', value: body.email },
          { label: 'Address', value: body.address || 'Not provided' },
        ])),
        section('Estimate', detailsTable([
          { label: 'Measured area', value: `${body.sqft ? body.sqft.toLocaleString() : 0} sq ft` },
          ...services.map((s) => ({ label: s.name, value: `$${s.price}` })),
          { label: 'Total', value: `$${body.price ? body.price.toLocaleString() : 0}` },
        ])),
        body.map_image_url
          ? section('What they measured', `<img src="${escapeHtml(body.map_image_url)}" alt="Lawn map" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:1px solid #DDE5DF;">`)
          : '',
      ].join(''),
    });

    // Send email to the owner
    await sendEmail({
      to: "floralawncareri@gmail.com",
      subject: `New lead: ${body.name || 'Website user'} · Auto Lawn · $${body.price}`,
      text: `New Lead: ${body.name || 'Website User'} requested a quote for $${body.price}.`,
      html: htmlContent,
      type: 'LEAD',
      recipientName: "Admin",
      replyTo: body.email
    });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error processing lead email:", e);
    return NextResponse.json({ error: "Could not send the lead" }, { status: 500 });
  }
}
