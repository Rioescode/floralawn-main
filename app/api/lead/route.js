import { NextResponse } from "next/server";
import { sendEmail } from "@/libs/resend";

// This route receives lead data and sends an email notification using Resend
export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Build the email HTML content
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #22C55E;">🚨 New Quote Lead</h1>
        <p>A new potential customer just submitted their property details for review via the Auto Lawn tool.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Contact Details</h2>
          <p><strong>Name:</strong> ${body.name || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${body.phone || 'Not provided'}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          <p><strong>Address:</strong> ${body.address || 'Not provided'}</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Quote Summary</h2>
          <p><strong>Measured Area:</strong> ${body.sqft ? body.sqft.toLocaleString() : 0} SQFT</p>
          <p><strong>Total Estimated Price:</strong> <span style="color: #22C55E; font-weight: bold; font-size: 18px;">$${body.price ? body.price.toLocaleString() : 0}</span></p>
          
          <h3 style="margin-top: 15px; font-size: 14px; text-transform: uppercase; color: #64748b;">Selected Services:</h3>
          <ul style="padding-left: 20px;">
            ${body.services && Array.isArray(body.services) 
              ? body.services.map(s => `<li style="margin-bottom: 5px;"><strong>${s.name}</strong>: $${s.price}</li>`).join('') 
              : '<li>No specific services listed</li>'}
          </ul>
        </div>
        
        ${body.map_image_url ? `
        <div style="margin-top: 20px;">
          <h2 style="font-size: 18px;">Lawn Tracing Snapshot</h2>
          <p style="font-size: 14px; color: #64748b;">This is what the customer measured:</p>
          <img src="${body.map_image_url}" alt="Lawn Map Snapshot" style="max-width: 100%; border-radius: 12px; border: 2px solid #e2e8f0; margin-top: 10px;" />
        </div>
        ` : ''}
        
        <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">
          This is an automated message from your Floralawn system.
        </p>
      </div>
    `;

    // Send email to the owner
    await sendEmail({
      to: "esckoofficial@gmail.com",
      subject: `🚨 New Lead: ${body.name || 'Website User'} - $${body.price}`,
      text: `New Lead: ${body.name || 'Website User'} requested a quote for $${body.price}.`,
      html: htmlContent,
      type: 'LEAD',
      recipientName: "Admin",
      replyTo: body.email
    });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error processing lead email:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
