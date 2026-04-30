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
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preheader text -->
  <div style="display: none; font-size: 1px; color: #020617; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${content.preheader || 'Special offer from Flora Lawn & Landscaping'}
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #020617; padding: 40px 0;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #0f172a; border-radius: 24px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 50px 40px; text-align: center; border-bottom: 3px solid #22c55e;">
              <div style="background-color: #ffffff; padding: 16px 20px; border-radius: 16px; display: inline-block; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn" style="width: 140px; height: auto; display: block;">
              </div>
              <div></div>
              <div style="display: inline-block; background: #22c55e; color: #fff; font-size: 10px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; padding: 6px 16px; border-radius: 99px; margin-bottom: 15px;">${content.headerIcon || '🌱'} VIP UPDATE</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 34px; font-weight: 900; font-style: italic; letter-spacing: -0.02em; text-transform: uppercase; line-height: 1.1;">
                ${content.headerTitle || 'Special Offer'}
              </h1>
              ${content.headerSubtitle ? `<p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">${content.headerSubtitle}</p>` : ''}
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #f8fafc; font-weight: 700;">Hi ${name},</p>
              ${content.intro ? `<p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.8; color: #94a3b8;">${content.intro}</p>` : ''}
              
              ${content.body || ''}
              
              <!-- Call to Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
                <tr>
                  <td align="center">
                    <a href="https://floralawn-and-landscaping.com/contact" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 25px -5px rgba(34, 197, 94, 0.4);">SECURE THIS OFFER →</a>
                  </td>
                </tr>
              </table>
              
              ${content.closing ? `<p style="margin: 30px 0 0 0; font-size: 15px; line-height: 1.8; color: #64748b; text-align: center; font-style: italic;">"${content.closing}"</p>` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #020617; padding: 40px; border-top: 1px solid #1e293b;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 25px;">
                    <p style="margin: 0; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.1em;">
                      <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: none; border-bottom: 1px solid #334155;">Unsubscribe</a>
                      &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                      <a href="https://floralawn-and-landscaping.com/contact" style="color: #64748b; text-decoration: none; border-bottom: 1px solid #334155;">Contact Us</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 25px; border-top: 1px solid #1e293b;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; text-align: left;">
                      <tr>
                        <td style="padding: 0; vertical-align: middle; padding-right: 20px; border-right: 1px solid #1e293b; width: 80px;">
                          <div style="background-color: #ffffff; padding: 6px; border-radius: 10px; display: inline-block;">
                            <img src="https://floralawn-and-landscaping.com/flora-logo-final.png" alt="Flora Lawn" style="width: 60px; height: 60px; object-fit: contain; display: block;">
                          </div>
                        </td>
                        <td style="padding: 0; vertical-align: middle; padding-left: 20px;">
                          <p style="margin: 0; font-size: 15px; font-weight: 900; color: #f8fafc; line-height: 1.3;">Rafael Escobar</p>
                          <p style="margin: 2px 0 0 0; font-size: 10px; font-weight: 800; color: #22c55e; text-transform: uppercase; letter-spacing: 0.1em;">Owner &middot; Flora Lawn &amp; Landscaping Inc</p>
                          <div style="height: 10px;"></div>
                          <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.9;">
                            📞 <a href="tel:4013890913" style="color: #64748b; text-decoration: none;">(401) 389-0913</a><br>
                            📧 <a href="mailto:floralawncareri@gmail.com" style="color: #64748b; text-decoration: none;">floralawncareri@gmail.com</a><br>
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
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0; background-color: #1e293b; border-radius: 16px; border-left: 4px solid #22c55e; overflow: hidden;">
    <tr>
      <td style="padding: 25px 30px;">
        <p style="margin: 0 0 15px 0; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em;">${icon} ${title}</p>
        <ul style="margin: 0; padding-left: 20px; line-height: 2.2; color: #e2e8f0; font-size: 15px; font-weight: 500;">
          ${items.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
        </ul>
      </td>
    </tr>
  </table>
`;

// Helper to create discount card
const createDiscountCard = (title, discount, code, description = '') => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0; background: linear-gradient(135deg, #022c22 0%, #064e3b 100%); border-radius: 16px; border: 1px solid #059669; overflow: hidden;">
    <tr>
      <td style="padding: 35px 30px; text-align: center;">
        <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 900; color: #34d399; text-transform: uppercase; letter-spacing: 0.2em;">${title}</p>
        <p style="margin: 0 0 15px 0; font-size: 48px; font-weight: 900; font-style: italic; color: #ffffff; line-height: 1; text-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">${discount}</p>
        ${description ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #a7f3d0; line-height: 1.6; font-weight: 500;">${description}</p>` : ''}
        <div style="background-color: #020617; padding: 16px 24px; border-radius: 12px; display: inline-block; margin-top: 10px; border: 1px dashed #34d399;">
          <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">USE PROMO CODE</p>
          <p style="margin: 8px 0 0 0; font-size: 24px; color: #22c55e; font-weight: 900; letter-spacing: 0.1em;">${code}</p>
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
              <td style="padding: 25px; background-color: #064e3b; border-radius: 16px; border-left: 4px solid #34d399;">
                <p style="margin: 0 0 15px 0; font-size: 11px; font-weight: 900; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.1em;">Benefits of Fresh Mulch:</p>
                <ul style="margin: 0; padding-left: 20px; line-height: 2.2; color: #f8fafc; font-size: 15px; font-weight: 500;">
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
          
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0; background-color: #1e293b; border-radius: 16px; border-left: 4px solid #3b82f6; overflow: hidden;">
            <tr>
              <td style="padding: 25px 30px;">
                <p style="margin: 0 0 15px 0; font-size: 11px; font-weight: 900; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.1em;">Perfect for:</p>
                <ul style="margin: 0; padding-left: 20px; line-height: 2.2; color: #e2e8f0; font-size: 15px; font-weight: 500;">
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
