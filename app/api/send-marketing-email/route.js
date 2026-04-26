import { NextResponse } from 'next/server';
import { sendEmail } from '@/libs/resend';
import { generalApiLimiter } from '@/lib/rate-limiter';

// Helper function to create email wrapper with modern design
const createEmailTemplate = (name, unsubscribeUrl, accountUrl, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flora Lawn & Landscaping</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preheader text -->
  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${content.preheader || 'Special offer from Flora Lawn & Landscaping'}
  </div>
  
  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${content.headerIcon || '🌱'} ${content.headerTitle || 'Special Offer'}
              </h1>
              ${content.headerSubtitle ? `<p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 16px; font-weight: 400;">${content.headerSubtitle}</p>` : ''}
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.6; color: #1f2937; font-weight: 500;">Hi ${name},</p>
              ${content.intro ? `<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.8; color: #4b5563;">${content.intro}</p>` : ''}
              
              ${content.body || ''}
              
              <!-- Account CTA Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; border: 2px solid #22C55E; overflow: hidden;">
                <tr>
                  <td style="padding: 25px 30px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #065f46;">✨ Create Your Free Account</p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #047857;">Request jobs faster, manage your services, skip appointments, and track your service history - all in one place!</p>
                    <a href="${accountUrl}" style="display: inline-block; background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3); transition: all 0.3s ease;">Create Free Account →</a>
                  </td>
                </tr>
              </table>
              
              <!-- Call to Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="tel:4013890913" style="display: inline-block; background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3);">📞 Call (401) 389-0913</a>
                  </td>
                </tr>
              </table>
              
              ${content.closing ? `<p style="margin: 30px 0 0 0; font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center; font-style: italic;">${content.closing}</p>` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                      <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline; margin: 0 8px;">Unsubscribe</a>
                      <span style="color: #d1d5db;">|</span>
                      <a href="${accountUrl}" style="color: #6b7280; text-decoration: underline; margin: 0 8px;">Manage Preferences</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; text-align: left;">
                      <tr>
                        <td style="padding: 0; vertical-align: middle; padding-right: 14px; border-right: 1px solid #e5e7eb; width: 60px;">
                          <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn" style="width: 56px; height: 56px; object-fit: contain; display: block;">
                        </td>
                        <td style="padding: 0; vertical-align: middle; padding-left: 14px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 800; color: #1f2937; line-height: 1.3;">Rafael Escobar</p>
                          <p style="margin: 0; font-size: 11px; font-weight: 600; color: #22C55E; text-transform: uppercase; letter-spacing: 0.05em;">Owner &middot; Flora Lawn &amp; Landscaping Inc</p>
                          <div style="height: 6px;"></div>
                          <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.8;">
                            📞 <a href="tel:4013890913" style="color: #6b7280; text-decoration: none;">(401) 389-0913</a><br>
                            📧 <a href="mailto:floralawncareri@gmail.com" style="color: #6b7280; text-decoration: none;">floralawncareri@gmail.com</a><br>
                            🌐 <a href="https://floralawn-and-landscaping.com" style="color: #22C55E; text-decoration: none;">floralawn-and-landscaping.com</a><br>
                            📍 45 Vernon Street, Pawtucket, RI 02860
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Helper to create service list card
const createServiceCard = (title, items, icon = '') => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0; background-color: #f0f9ff; border-radius: 10px; border-left: 4px solid #3b82f6; overflow: hidden;">
    <tr>
      <td style="padding: 20px 25px;">
        <p style="margin: 0 0 15px 0; font-size: 17px; font-weight: 700; color: #1e40af;">${icon} ${title}</p>
        <ul style="margin: 0; padding-left: 20px; line-height: 2; color: #374151; font-size: 15px;">
          ${items.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
        </ul>
      </td>
    </tr>
  </table>
`;

// Helper to create discount card
const createDiscountCard = (title, discount, code, description = '') => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; border: 2px solid #f59e0b; overflow: hidden; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">
    <tr>
      <td style="padding: 30px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">${title}</p>
        <p style="margin: 0 0 15px 0; font-size: 42px; font-weight: 800; color: #d97706; line-height: 1;">${discount}</p>
        ${description ? `<p style="margin: 0 0 15px 0; font-size: 15px; color: #92400e; line-height: 1.5;">${description}</p>` : ''}
        <div style="background-color: #ffffff; padding: 12px 20px; border-radius: 8px; display: inline-block; margin-top: 10px;">
          <p style="margin: 0; font-size: 16px; color: #92400e; font-weight: 600;">Use code: <span style="font-size: 20px; color: #d97706; font-weight: 800; letter-spacing: 2px;">${code}</span></p>
        </div>
      </td>
    </tr>
  </table>
`;

const emailTemplates = {
  spring_cleanup: {
    subject: '🌱 Spring is Here! Time for Your Lawn Cleanup',
    preheader: 'Get 15% OFF your first spring cleanup. Schedule today!',
    html: (name, unsubscribeUrl, accountUrl) => createEmailTemplate(
      name,
      unsubscribeUrl,
      accountUrl,
      {
        preheader: 'Get 15% OFF your first spring cleanup. Schedule today!',
        headerIcon: '🌱',
        headerTitle: 'Spring is Here!',
        headerSubtitle: 'Time to give your lawn a fresh start',
        intro: 'Spring is the perfect time to give your lawn a fresh start! After a long winter, your yard needs some TLC to look its best.',
        body: `
          ${createServiceCard('Our Spring Cleanup Service Includes:', [
            'Leaf and debris removal',
            'Lawn raking and dethatching',
            'Pruning and trimming',
            'Garden bed preparation',
            'Mulch application'
          ], '🌿')}
          
          ${createDiscountCard('Special Spring Offer', '15% OFF', 'SPRING15', 'Your first spring cleanup')}
        `,
        closing: "Let's make your lawn the envy of the neighborhood!"
      }
    )
  },
  mulch_season: {
    subject: '🌿 Mulch Season is Here - Protect Your Landscaping',
    preheader: 'Get 20% OFF mulch installation. Schedule today!',
    html: (name, unsubscribeUrl, accountUrl) => createEmailTemplate(
      name,
      unsubscribeUrl,
      accountUrl,
      {
        preheader: 'Get 20% OFF mulch installation. Schedule today!',
        headerIcon: '🌿',
        headerTitle: 'Mulch Season is Here!',
        headerSubtitle: 'Protect and beautify your landscaping',
        intro: 'It\'s mulch season! Fresh mulch not only makes your landscaping look beautiful, but it also provides essential benefits for your plants.',
        body: `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
            <tr>
              <td style="padding: 20px; background-color: #f0fdf4; border-radius: 10px; border-left: 4px solid #22C55E;">
                <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #166534;">Benefits of Fresh Mulch:</p>
                <ul style="margin: 0; padding-left: 20px; line-height: 2; color: #374151; font-size: 15px;">
                  <li>Retains moisture for your plants</li>
                  <li>Prevents weed growth</li>
                  <li>Protects plant roots from temperature changes</li>
                  <li>Adds nutrients to your soil</li>
                </ul>
              </td>
            </tr>
          </table>
          
          ${createServiceCard('We offer premium mulch in various types:', [
            'Hardwood mulch',
            'Pine bark mulch',
            'Colored mulch (black, brown, red)',
            'Organic compost mulch'
          ], '🌳')}
          
          ${createDiscountCard('Special Offer', '20% OFF', 'MULCH20', 'Mulch installation this month')}
        `
      }
    )
  },
  summer_maintenance: {
    subject: '☀️ Keep Your Lawn Green All Summer Long',
    preheader: 'Get 10% OFF recurring maintenance. Schedule today!',
    html: (name, unsubscribeUrl, accountUrl) => createEmailTemplate(
      name,
      unsubscribeUrl,
      accountUrl,
      {
        preheader: 'Get 10% OFF recurring maintenance. Schedule today!',
        headerIcon: '☀️',
        headerTitle: 'Summer Lawn Care',
        headerSubtitle: 'Keep your lawn healthy and green',
        intro: 'Summer heat can be tough on your lawn! Regular maintenance is key to keeping it healthy and green throughout the season.',
        body: `
          ${createServiceCard('Our Summer Maintenance Includes:', [
            'Regular mowing and edging',
            'Fertilization and weed control',
            'Proper watering guidance',
            'Pest and disease prevention',
            'Aeration if needed'
          ], '🌱')}
          
          ${createDiscountCard('Summer Special', '10% OFF', 'SUMMER10', 'Recurring maintenance services')}
        `
      }
    )
  },
  fall_cleanup: {
    subject: '🍂 Fall Cleanup - Prepare Your Yard for Winter',
    preheader: 'Get 15% OFF fall cleanup. Schedule today!',
    html: (name, unsubscribeUrl, accountUrl) => createEmailTemplate(
      name,
      unsubscribeUrl,
      accountUrl,
      {
        preheader: 'Get 15% OFF fall cleanup. Schedule today!',
        headerIcon: '🍂',
        headerTitle: 'Fall Cleanup Time!',
        headerSubtitle: 'Prepare your yard for winter',
        intro: 'Fall is here, and it\'s time to prepare your yard for winter! Proper fall cleanup ensures a healthy lawn next spring.',
        body: `
          ${createServiceCard('Our Fall Cleanup Service Includes:', [
            'Leaf removal and disposal',
            'Lawn aeration',
            'Overseeding for thicker grass',
            'Pruning and trimming',
            'Winter preparation'
          ], '🍁')}
          
          ${createDiscountCard('Fall Special', '15% OFF', 'FALL15', 'Fall cleanup services')}
        `
      }
    )
  },
  holiday_coupon: {
    subject: '🎁 Special Holiday Discount - Limited Time!',
    preheader: 'Get 25% OFF any service. Limited time offer!',
    html: (name, unsubscribeUrl, accountUrl) => createEmailTemplate(
      name,
      unsubscribeUrl,
      accountUrl,
      {
        preheader: 'Get 25% OFF any service. Limited time offer!',
        headerIcon: '🎁',
        headerTitle: 'Happy Holidays!',
        headerSubtitle: 'Special holiday discount for you',
        intro: 'Happy Holidays from Flora Lawn & Landscaping! We\'re grateful for your business this year and want to show our appreciation.',
        body: `
          ${createDiscountCard('Holiday Special', '25% OFF', 'HOLIDAY25', 'Any service when you book before the end of the month!')}
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0; background-color: #f0f9ff; border-radius: 10px; overflow: hidden;">
            <tr>
              <td style="padding: 20px 25px;">
                <p style="margin: 0 0 15px 0; font-size: 17px; font-weight: 700; color: #1e40af;">Perfect for:</p>
                <ul style="margin: 0; padding-left: 20px; line-height: 2; color: #374151; font-size: 15px;">
                  <li>Gift certificates</li>
                  <li>Pre-paying for spring services</li>
                  <li>One-time cleanups</li>
                  <li>New service installations</li>
                </ul>
              </td>
            </tr>
          </table>
        `,
        closing: 'Thank you for choosing Flora Lawn & Landscaping!'
      }
    )
  },
  seasonal_reminder: {
    subject: '📅 Time for Your Seasonal Service',
    preheader: 'Schedule your seasonal service today!',
    html: (name, unsubscribeUrl, accountUrl) => createEmailTemplate(
      name,
      unsubscribeUrl,
      accountUrl,
      {
        preheader: 'Schedule your seasonal service today!',
        headerIcon: '📅',
        headerTitle: 'Seasonal Service Reminder',
        headerSubtitle: 'Time for your regular maintenance',
        intro: 'It\'s that time of year again! Regular seasonal maintenance keeps your lawn healthy and beautiful.',
        body: '',
        closing: 'We look forward to serving you!'
      }
    )
  }
};

export async function POST(request) {
  try {
    // Rate limiting
    const rateLimitResult = await generalApiLimiter(request);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const { template, subscribers } = body;

    if (!template || !subscribers || !Array.isArray(subscribers)) {
      return NextResponse.json(
        { error: 'Template and subscribers array are required' },
        { status: 400 }
      );
    }

    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      return NextResponse.json(
        { error: 'Invalid template' },
        { status: 400 }
      );
    }

    let sent = 0;
    let failed = 0;
    const errors = [];

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floralawn-and-landscaping.com';
    
    // Send emails to all subscribers
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        const accountUrl = `${baseUrl}/login?redirect=/customer/dashboard`;
        
        // Generate HTML with proper text version for better deliverability
        const html = emailTemplate.html(
          subscriber.name || 'Valued Customer',
          unsubscribeUrl,
          accountUrl
        );
        
        // Create better text version (important for inbox placement)
        const textVersion = emailTemplate.text ? 
          emailTemplate.text(subscriber.name || 'Valued Customer') :
          `${emailTemplate.subject}\n\nHi ${subscriber.name || 'Valued Customer'},\n\n${emailTemplate.preheader}\n\nCreate your free account: ${accountUrl}\n\nUnsubscribe: ${unsubscribeUrl}`;
        
        await sendEmail({
          to: subscriber.email,
          subject: emailTemplate.subject,
          text: textVersion,
          html: html,
          replyTo: 'floralawncareri@gmail.com'
        });

        sent++;
      } catch (error) {
        console.error(`Error sending email to ${subscriber.email}:`, error);
        failed++;
        errors.push({ email: subscriber.email, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in send-marketing-email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send marketing emails' },
      { status: 500 }
    );
  }
}
