import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const LAWN_CARE_SERVICES = {
  'mowing': 'Lawn Mowing',
  'fertilization': 'Lawn Fertilization',
  'weed_control': 'Weed Control',
  'aeration': 'Lawn Aeration',
  'overseeding': 'Overseeding',
  'mulching': 'Mulching',
  'hedge_trimming': 'Hedge Trimming',
  'garden_maintenance': 'Garden Maintenance',
  'spring_cleanup': 'Spring Cleanup',
  'fall_cleanup': 'Fall Cleanup',
  'leaf_removal': 'Leaf Removal',
  'snow_removal': 'Snow Removal',
};

export async function POST(request) {
  try {
    const { contractId, sendEmail, sendSMS } = await request.json();

    if (!contractId) {
      return NextResponse.json({ error: 'Service confirmation ID is required' }, { status: 400 });
    }

    // Fetch service confirmation
    let contract;
    let { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    // If contracts table doesn't exist, try appointments table
    if (contractError && contractError.code === '42P01') {
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', contractId)
        .eq('booking_type', 'Contract Request')
        .single();

      if (appointmentError || !appointmentData) {
        return NextResponse.json({ error: 'Service confirmation not found' }, { status: 404 });
      }

      // Parse notes to extract service confirmation details
      const notes = appointmentData.notes || '';
      const propertySizeMatch = notes.match(/Property Size:\s*(.+?)(?:\n|$)/i);
      const frequencyMatch = notes.match(/Frequency:\s*(.+?)(?:\n|$)/i);
      const priceMatch = notes.match(/Monthly Price:\s*\$?(.+?)(?:\n|$)/i);
      const instructionsMatch = notes.match(/Special Instructions:\s*(.+?)(?:\n*$)/is);
      
      // Map service names to IDs
      const serviceNames = appointmentData.service_type?.split(', ') || [];
      const serviceIds = serviceNames.map(name => {
        const trimmed = name.trim();
        const id = Object.keys(LAWN_CARE_SERVICES).find(
          key => LAWN_CARE_SERVICES[key] === trimmed
        );
        return id || trimmed.toLowerCase().replace(/\s+/g, '_');
      });

      // Transform appointment to service confirmation format
      contract = {
        customer_name: appointmentData.customer_name,
        customer_email: appointmentData.customer_email,
        customer_phone: appointmentData.customer_phone,
        property_address: appointmentData.street_address,
        city: appointmentData.city,
        selected_services: serviceIds.length > 0 ? serviceIds : (serviceNames.length > 0 ? serviceNames : []),
        service_frequency: frequencyMatch ? frequencyMatch[1].trim() : '',
        property_size: propertySizeMatch ? propertySizeMatch[1].trim() : '',
        monthly_price: priceMatch ? priceMatch[1].trim() : '',
        start_date: appointmentData.date,
        special_instructions: instructionsMatch ? instructionsMatch[1].trim() : (notes.split('Special Instructions:')[0] || ''),
      };
    } else if (contractError || !contractData) {
      return NextResponse.json({ error: 'Service confirmation not found' }, { status: 404 });
    } else {
      contract = contractData;
    }

    const results = {
      emailSent: false,
      smsSent: false,
      errors: []
    };

    // Format services for display - only selected services
    const buildServicesList = (selectedServices) => {
      if (!selectedServices || selectedServices.length === 0) {
        return 'Services to be determined';
      }
      
      return selectedServices.map(serviceId => {
        const serviceName = LAWN_CARE_SERVICES[serviceId] || serviceId;
        return `✓ ${serviceName}`;
      }).join('\n');
    };

    const servicesList = Array.isArray(contract.selected_services)
      ? contract.selected_services.map(id => LAWN_CARE_SERVICES[id] || id).join(', ')
      : contract.selected_services || 'Various lawn care services';
    
    const servicesListFormatted = buildServicesList(contract.selected_services);

    // Generate service confirmation content
    const confirmationContent = `
SERVICE CONFIRMATION

Thank you for choosing Flora Lawn & Landscaping!

Customer Information:
Name: ${contract.customer_name}
Email: ${contract.customer_email}
Phone: ${contract.customer_phone || 'N/A'}
Address: ${contract.property_address || 'N/A'}, ${contract.city || 'N/A'}

Property Details:
Property Size: ${contract.property_size || 'Not specified'}
Service Frequency: ${contract.service_frequency || 'To be determined'}
${contract.monthly_price ? `Monthly Price: $${contract.monthly_price}\n` : ''}Start Date: ${contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'To be determined'}

Selected Services:
${servicesListFormatted || servicesList}

${contract.special_instructions ? `Special Instructions:\n${contract.special_instructions}\n\n` : ''}Service Details:
• Services will be performed according to the schedule above
• Services may be adjusted based on weather conditions
• Please ensure we have access to your property during service times
• You can skip or reschedule services with 24-hour notice
• Payment: After service is completed (you can send payment the next day or next week - whatever works for you!)

ADDITIONAL SERVICES:
• Need something extra? Just let us know and we'll provide a quote

SATISFACTION GUARANTEE:
• Your satisfaction is our priority!
• If something doesn't look right, contact us within 24 hours
• We'll come back to fix it at no charge

QUESTIONS OR CONCERNS?
We're here to help! Please don't hesitate to reach out:
Phone: (401) 389-0913
Email: floralawncareri@gmail.com

Thank you for choosing Flora Lawn & Landscaping!

Confirmation Date: ${new Date().toLocaleDateString()}
Service Start Date: ${contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'To be determined'}

---
Flora Lawn & Landscaping Inc
📍 45 Vernon St, Pawtucket, RI 02860
📞 (401) 389-0913
✉️ floralawncareri@gmail.com

Business Hours:
Monday - Friday: 7:00 AM - 6:00 PM
Saturday: 8:00 AM - 4:00 PM
Sunday: Closed

---
You received this email because you requested a service confirmation from Flora Lawn & Landscaping.
Unsubscribe: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://floralawn-and-landscaping.com'}/unsubscribe?email=${encodeURIComponent(contract.customer_email)}
    `.trim();

    // Send email if requested
    if (sendEmail && contract.customer_email) {
      try {
        const { sendEmail: sendEmailFunction } = await import('@/libs/resend');
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #22C55E; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Service Confirmation</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Thank you for choosing Flora Lawn & Landscaping!</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
              <h2 style="color: #111827; margin-top: 0;">Customer Information</h2>
              <p><strong>Name:</strong> ${contract.customer_name}</p>
              <p><strong>Email:</strong> ${contract.customer_email}</p>
              <p><strong>Phone:</strong> ${contract.customer_phone || 'N/A'}</p>
              <p><strong>Address:</strong> ${contract.property_address || 'N/A'}, ${contract.city || 'N/A'}</p>
            </div>

            <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #111827; margin-top: 0;">Property Details</h2>
              <p><strong>Property Size:</strong> ${contract.property_size || 'Not specified'}</p>
              <p><strong>Service Frequency:</strong> ${contract.service_frequency || 'To be determined'}</p>
              ${contract.monthly_price ? `<p><strong>Monthly Price:</strong> $${contract.monthly_price}</p>` : ''}
              <p><strong>Start Date:</strong> ${contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'To be determined'}</p>
            </div>

            <div style="background-color: #f0fdf4; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #111827; margin-top: 0;">Selected Services</h2>
              <ul style="margin: 0; padding-left: 20px;">
                ${Array.isArray(contract.selected_services) && contract.selected_services.length > 0
                  ? contract.selected_services.map(id => `<li style="margin-bottom: 5px;">✓ ${LAWN_CARE_SERVICES[id] || id}</li>`).join('')
                  : `<li>${servicesList}</li>`
                }
              </ul>
            </div>

            ${contract.special_instructions ? `
            <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #111827; margin-top: 0;">Special Instructions</h2>
              <p style="white-space: pre-wrap; color: #374151;">${contract.special_instructions}</p>
            </div>
            ` : ''}

            <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #111827; margin-top: 0;">Service Details</h2>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 8px;">Services will be performed according to the schedule above</li>
                <li style="margin-bottom: 8px;">Services may be adjusted based on weather conditions</li>
                <li style="margin-bottom: 8px;">Please ensure we have access to your property during service times</li>
                <li style="margin-bottom: 8px;">You can skip or reschedule services with 24-hour notice</li>
                <li style="margin-bottom: 8px;"><strong>Payment:</strong> After service is completed (you can send payment the next day or next week - whatever works for you!)</li>
              </ul>
            </div>

            <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #111827; margin-top: 0;">Additional Services</h2>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li>Need something extra? Just let us know and we'll provide a quote</li>
              </ul>
            </div>

            <div style="background-color: #f0fdf4; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #111827; margin-top: 0;">Satisfaction Guarantee</h2>
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 8px;">Your satisfaction is our priority!</li>
                <li style="margin-bottom: 8px;">If something doesn't look right, contact us within 24 hours</li>
                <li style="margin-bottom: 8px;">We'll come back to fix it at no charge</li>
              </ul>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #111827; margin-top: 0;">Questions or Concerns?</h2>
              <p style="color: #374151; margin-bottom: 10px;">We're here to help! Please don't hesitate to reach out:</p>
              <p style="color: #374151; margin: 5px 0;"><strong>Phone:</strong> (401) 389-0913</p>
              <p style="color: #374151; margin: 5px 0;"><strong>Email:</strong> floralawncareri@gmail.com</p>
            </div>

            <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="color: #374151; margin: 5px 0;"><strong>Confirmation Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="color: #374151; margin: 5px 0;"><strong>Service Start Date:</strong> ${contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'To be determined'}</p>
            </div>

            <div style="background-color: #22C55E; color: white; padding: 20px; border-radius: 0 0 8px 8px; margin-top: 20px; text-align: center;">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">Thank you for choosing Flora Lawn & Landscaping!</p>
            </div>

            <!-- Company Info Card -->
            <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-top: 20px;">
              <h3 style="color: #111827; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: bold;">Flora Lawn & Landscaping Inc</h3>
              <div style="color: #374151; line-height: 1.8;">
                <p style="margin: 5px 0;"><strong>📍 Address:</strong> 45 Vernon St, Pawtucket, RI 02860</p>
                <p style="margin: 5px 0;"><strong>📞 Phone:</strong> (401) 389-0913</p>
                <p style="margin: 5px 0;"><strong>✉️ Email:</strong> floralawncareri@gmail.com</p>
                <p style="margin: 10px 0 5px 0;"><strong>🕐 Business Hours:</strong></p>
                <div style="margin-left: 15px; font-size: 14px;">
                  <p style="margin: 2px 0;">Monday - Friday: 7:00 AM - 6:00 PM</p>
                  <p style="margin: 2px 0;">Saturday: 8:00 AM - 4:00 PM</p>
                  <p style="margin: 2px 0;">Sunday: Closed</p>
                </div>
              </div>
            </div>

            <!-- Unsubscribe Footer -->
            <div style="text-align: center; padding: 20px 0; margin-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                You received this email because you requested a service confirmation from Flora Lawn & Landscaping.
              </p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://floralawn-and-landscaping.com'}/unsubscribe?email=${encodeURIComponent(contract.customer_email)}" 
                 style="color: #6b7280; text-decoration: underline; font-size: 12px;">
                Unsubscribe from emails
              </a>
            </div>
          </div>
        `;

        await sendEmailFunction({
          to: contract.customer_email,
          subject: 'Service Confirmation - Flora Lawn & Landscaping',
          text: confirmationContent,
          html: emailHtml,
          replyTo: 'floralawncareri@gmail.com'
        });

        results.emailSent = true;
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        results.errors.push('Failed to send email: ' + emailError.message);
      }
    }

    // Send SMS if requested
    if (sendSMS && contract.customer_phone) {
      try {
        const { sendSMS: sendSMSFunction } = await import('@/libs/twilio');
        
        const smsMessage = `Hi ${contract.customer_name}! Your service confirmation is ready. Services: ${servicesList}. ${contract.service_frequency ? `Frequency: ${contract.service_frequency}. ` : ''}We'll contact you soon to finalize details. Flora Lawn & Landscaping (401) 389-0913`;

        await sendSMSFunction(contract.customer_phone, smsMessage);
        results.smsSent = true;
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
        // Fallback to SMS link
        const phoneNumber = contract.customer_phone.replace(/\D/g, '');
        results.smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(`Hi ${contract.customer_name}! Your service confirmation: ${servicesList}. Contact us at (401) 389-0913`)}`;
        results.errors.push('Failed to send SMS - use SMS link instead');
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error sending service confirmation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send service confirmation' },
      { status: 500 }
    );
  }
}

