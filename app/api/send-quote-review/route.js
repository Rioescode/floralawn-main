import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, phone, address, area, price, breakdown, preferredDate, customJobDetails } = body;

    if (!email || !name || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminEmail = 'esckoofficial@gmail.com';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floralawn-and-landscaping.com';

    // Calculate discount if present in breakdown
    const discountItem = breakdown?.find(item => item.name.includes('DISCOUNT'));
    const savingsAmount = discountItem ? Math.abs(discountItem.price) : 0;

    // PERSIST TO DATABASE (Supabase)
    if (supabaseAdmin) {
      try {
        const { error: dbError } = await supabaseAdmin
          .from('leads')
          .insert([{
            email,
            name,
            phone,
            address,
            area,
            price,
            discount: savingsAmount,
            breakdown: JSON.stringify(breakdown),
            preferred_date: preferredDate,
            custom_details: customJobDetails,
            status: 'NEW QUOTE',
            created_at: new Date().toISOString()
          }]);
        
        if (dbError) console.error('Database lead insertion failed:', dbError.message);
      } catch (err) {
        console.error('Lead persistence error:', err);
      }
    }

    // 1. EMAIL TO CUSTOMER
    const customerHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 40px; text-align: center; border-bottom: 5px solid #22c55e;">
          <h1 style="color: white; margin: 0; font-style: italic;">AutoLawn™ AI</h1>
          <p style="color: #22c55e; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.2em;">Quote Received & In Review</p>
        </div>
        <div style="padding: 40px;">
          <h2 style="font-size: 24px; font-weight: 800; color: #0f172a;">Hi ${name},</h2>
          <p style="color: #475569; line-height: 1.6;">We've received your AI-generated quote for <strong>${address}</strong>. Our team is currently reviewing the measurements and job details to confirm your price.</p>
          
          ${savingsAmount > 0 ? `
            <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 15px; margin: 20px 0; text-align: center;">
              <p style="color: #047857; font-weight: 900; text-transform: uppercase; font-size: 12px; margin: 0;">Multi-Service Reward Applied!</p>
              <p style="color: #059669; font-size: 24px; font-weight: 900; margin: 5px 0 0 0;">You Saved $${savingsAmount.toLocaleString()} today</p>
            </div>
          ` : ''}

          <div style="background-color: #f8fafc; padding: 25px; border-radius: 15px; margin: 30px 0; border: 1px solid #f1f5f9;">
            <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #94a3b8; margin-bottom: 15px;">Quote Overview</p>
            <div style="margin-bottom: 20px;"><strong>Property:</strong> ${address}</div>
            <div style="margin-bottom: 20px;"><strong>Area:</strong> ${area.toLocaleString()} SQFT</div>
            
            <p style="text-transform: uppercase; font-size: 8px; font-weight: 900; color: #94a3b8; margin: 25px 0 10px 0; border-top: 1px solid #e2e8f0; padding-top: 20px;">Service Breakdown</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${breakdown?.map(item => `
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: ${item.price < 0 ? '#10b981' : '#475569'}; font-weight: ${item.price < 0 ? '700' : '400'};">
                    ${item.name}
                  </td>
                  <td style="padding: 8px 0; text-align: right; font-size: 13px; font-weight: 700; color: ${item.price < 0 ? '#10b981' : '#0f172a'};">
                    ${item.price < 0 ? '-' : ''}$${Math.abs(item.price).toLocaleString()}
                  </td>
                </tr>
              `).join('')}
              <tr>
                <td style="padding-top: 15px; font-weight: 800; color: #0f172a; font-size: 16px;">Total Estimate</td>
                <td style="padding-top: 15px; text-align: right; font-weight: 900; color: #22c55e; font-size: 20px;">$${price.toLocaleString()}*</td>
              </tr>
            </table>

            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <strong>Preferred Date:</strong> ${preferredDate || 'To be confirmed'}
            </div>
          </div>

          <p style="font-size: 12px; color: #94a3b8; font-style: italic;">*Estimates are subject to final verify on-site. AI measurements have a 98% accuracy rate.</p>
          
          <p style="color: #0f172a; font-weight: 800; margin-top: 30px;">What's Next?</p>
          <p style="color: #475569; font-size: 14px;">We will contact you via text or email within 1-6 hours to confirm this rate and lock in your service date.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 10px; color: #94a3b8;">
          Flora Lawn & Landscaping • (401) 389-0913
        </div>
      </div>
    `;

    // 2. EMAIL TO ADMIN (Lead Dossier Style)
    const adminHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); background-color: #ffffff;">
          <div style="background-color: #0f172a; padding: 30px; border-bottom: 5px solid #22c55e; text-align: center;">
              <h2 style="color: white; margin: 0; font-style: italic; text-transform: uppercase; letter-spacing: 0.2em; font-size: 16px;">🔥 NEW AI QUOTE LEAD</h2>
              <p style="color: #22c55e; font-size: 10px; margin-top: 5px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;">Instant Estimation Pipeline</p>
          </div>
          <div style="padding: 35px;">
              <div style="margin-bottom: 30px;">
                  <p style="text-transform: uppercase; font-size: 9px; font-weight: 900; color: #94a3b8; margin-bottom: 5px; letter-spacing: 0.1em;">Customer Source Data</p>
                  <p style="font-size: 22px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: -0.01em;">${name}</p>
                  <p style="font-size: 15px; font-weight: 700; color: #22c55e; margin-top: 2px; font-style: italic;">📞 ${phone}</p>
                  <p style="font-size: 12px; font-weight: 600; color: #64748b; margin-top: 2px;">📧 ${email}</p>
              </div>

              ${savingsAmount > 0 ? `
              <div style="background-color: #ecfdf5; border-left: 5px solid #10b981; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                 <p style="margin: 0; font-size: 11px; font-weight: 900; color: #047857; text-transform: uppercase;">Reward Applied</p>
                 <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 900; color: #059669;">Customer Saved $${savingsAmount.toLocaleString()}</p>
              </div>
              ` : ''}

              <div style="background-color: #f8fafc; padding: 25px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #f1f5f9;">
                  <p style="text-transform: uppercase; font-size: 9px; font-weight: 900; color: #94a3b8; margin-bottom: 15px; letter-spacing: 0.1em; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Property & Quote Specs</p>
                  <p style="font-size: 14px; margin-bottom: 8px; color: #0f172a;"><strong>📍 Location:</strong> ${address}</p>
                  <p style="font-size: 14px; margin-bottom: 8px; color: #0f172a;"><strong>📐 Measurements:</strong> ${area.toLocaleString()} SQFT</p>
                  <p style="font-size: 14px; color: #0f172a;"><strong>📅 Preferred Start:</strong> ${preferredDate || 'NOT SPECIFIED'}</p>
              </div>

              <div style="margin-bottom: 30px;">
                  <p style="text-transform: uppercase; font-size: 9px; font-weight: 900; color: #94a3b8; margin-bottom: 15px; letter-spacing: 0.1em;">Quote Breakdown</p>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    ${breakdown?.map(item => `
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 0; font-size: 12px; font-weight: 700; color: ${item.price < 0 ? '#10b981' : '#334155'}; text-transform: ${item.price < 0 ? 'uppercase' : 'none'};">
                          ${item.name}
                        </td>
                        <td style="padding: 10px 0; text-align: right; font-weight: 900; color: ${item.price < 0 ? '#10b981' : '#0f172a'};">
                          ${item.price < 0 ? '-' : ''}$${Math.abs(item.price).toLocaleString()}
                        </td>
                      </tr>
                    `).join('')}
                    <tr>
                      <td style="padding: 20px 0; font-weight: 900; border-top: 2px solid #0f172a; text-transform: uppercase; font-size: 12px;">AI Estimate Total</td>
                      <td style="padding: 20px 0; text-align: right; font-weight: 900; color: #22c55e; font-size: 20px; border-top: 2px solid #0f172a;">$${price.toLocaleString()}</td>
                    </tr>
                  </table>
              </div>

              ${customJobDetails ? `
              <div style="margin-bottom: 35px;">
                  <p style="text-transform: uppercase; font-size: 9px; font-weight: 900; color: #94a3b8; margin-bottom: 10px; letter-spacing: 0.1em;">Custom Request Context</p>
                  <div style="background-color: #fffbeb; padding: 25px; border-radius: 15px; font-style: italic; color: #b45309; font-size: 14px; line-height: 1.6; border-left: 4px solid #f59e0b;">
                      "${customJobDetails}"
                  </div>
              </div>
              ` : ''}

              <a href="mailto:${email}" style="display: block; text-align: center; background-color: #0f172a; color: #ffffff; padding: 20px; border-radius: 15px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 0.1em; border-bottom: 4px solid #22c55e;">Reply to Inbound Lead</a>
          </div>
          <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="color: #94a3b8; font-size: 10px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.1em;">Flora Lawn CRM • AI Operations</p>
          </div>
      </div>
    `;

    // Send both emails
    await sendEmail({
      to: email,
      subject: 'Reviewing Your Quote - Flora Lawn & Landscaping',
      text: `Hi ${name}, we've received your quote for ${address}. ${savingsAmount > 0 ? `YOU SAVED $${savingsAmount}! ` : ''}Total: $${price}. We will review and confirm shortly.`,
      html: customerHtml,
      replyTo: adminEmail
    });

    await sendEmail({
      to: adminEmail,
      subject: `🔥 NEW AI QUOTE: ${name} (${address}) ${savingsAmount > 0 ? `(SAVED $${savingsAmount})` : ''}`,
      text: `New AI Quote Lead from ${name}. Address: ${address}. Customer Saved: $${savingsAmount}. Total Estimate: $${price}.`,
      html: adminHtml,
      replyTo: email
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending quote review email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
