// Contract Templates for Lawn Care Services
// These templates can be used when sending contracts to customers

export const CONTRACT_TEMPLATES = {
  basic_weekly: {
    title: 'Service Confirmation - Weekly Lawn Care',
    content: `
SERVICE CONFIRMATION

Thank you for choosing Flora Lawn & Landscaping! This document confirms the services we'll be providing for your property.

CUSTOMER INFORMATION:
Name: [CUSTOMER_NAME]
Address: [PROPERTY_ADDRESS]
City: [CITY]
Phone: [PHONE]
Email: [EMAIL]

SERVICES WE'LL PROVIDE:
[SELECTED_SERVICES_LIST]

SERVICE SCHEDULE:
- Frequency: Weekly (Every [DAY_OF_WEEK])
- Start Date: [START_DATE]
- Service Time: [TIME_WINDOW]

PROPERTY DETAILS:
- Property Size: [PROPERTY_SIZE]
- Special Instructions: [SPECIAL_INSTRUCTIONS]

PRICING:
- Service Rate: $[MONTHLY_PRICE]
- Payment: After service is completed (you can send payment the next day or next week - whatever works for you!)
- Payment Methods: Cash, Check, or Venmo

SERVICE DETAILS:

• Services will be performed weather permitting
• We'll notify you of any delays or schedule changes
• Please ensure we have clear access to your property
• Payment is due after service is completed - send it whenever convenient (next day or next week is fine!)
• You can skip services with 48-hour notice
• We're fully insured and licensed
• Please remove valuable items from service areas before we arrive

WEATHER & SCHEDULING:
• Services may be delayed due to weather (no charge for delays)
• Services resume automatically when conditions improve

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

Confirmation Date: [CONTRACT_DATE]
Service Start Date: [START_DATE]
    `.trim()
  },

  comprehensive_monthly: {
    title: 'Service Confirmation - Complete Lawn Care Package',
    content: `
SERVICE CONFIRMATION

Thank you for choosing Flora Lawn & Landscaping! This document confirms all the services we'll be providing to keep your property looking great.

CUSTOMER INFORMATION:
Name: [CUSTOMER_NAME]
Address: [PROPERTY_ADDRESS]
City: [CITY]
Phone: [PHONE]
Email: [EMAIL]

SERVICES WE'LL PROVIDE:
[SELECTED_SERVICES_LIST]

SERVICE SCHEDULE:
- Frequency: [FREQUENCY] (Weekly/Bi-Weekly/Monthly)
- Start Date: [START_DATE]
- Service Season: March through November
- Preferred Service Day: [DAY_OF_WEEK]
- Service Time Window: [TIME_WINDOW]

PROPERTY DETAILS:
- Property Size: [PROPERTY_SIZE]
- Number of Garden Beds: [NUMBER_OF_BEDS]
- Special Features: [SPECIAL_FEATURES]
- Special Instructions: [SPECIAL_INSTRUCTIONS]

PRICING:
- Monthly Rate: $[MONTHLY_PRICE]
- Annual Rate: $[ANNUAL_PRICE] (Save 10% with annual payment)
- Payment Terms: Due on the 1st of each month
- Payment Methods: Cash, Check, Venmo, or Credit Card

SERVICE DETAILS:

• All services performed professionally and efficiently
• We'll notify you of any schedule changes
• Services performed weather permitting
• Payment is due after service is completed - send it whenever convenient (next day or next week is fine!)
• You can skip services with 48-hour notice
• We're fully insured and licensed
• Please remove valuable items from service areas
• Please provide gate codes or access instructions if needed
• Please secure pets during service times

PAYMENT:
• Service Rate: $[MONTHLY_PRICE]
• Payment: After service is completed (send it the next day or next week - whatever works for you!)
• Payment Methods: Cash, Check, Venmo, or Credit Card

WEATHER & SCHEDULING:
• Services may be delayed due to weather (no charge for delays)
• Services resume automatically when conditions improve
• Seasonal services scheduled as appropriate

ADDITIONAL SERVICES:
• Need something extra? Just ask and we'll provide a quote
• Common extras: tree trimming, landscape design, hardscaping

QUALITY GUARANTEE:
• Your satisfaction is our priority!
• If something doesn't look right, contact us within 24 hours
• We'll come back to fix it at no charge

QUESTIONS OR CONCERNS?
We're here to help! Please don't hesitate to reach out:
Phone: (401) 389-0913
Email: floralawncareri@gmail.com

Thank you for choosing Flora Lawn & Landscaping!

Confirmation Date: [CONTRACT_DATE]
Service Start Date: [START_DATE]
    `.trim()
  },

  seasonal_contract: {
    title: 'Service Confirmation - Seasonal Lawn Care',
    content: `
SERVICE CONFIRMATION

Thank you for choosing Flora Lawn & Landscaping! This document confirms the seasonal services we'll be providing for your property.

CUSTOMER INFORMATION:
Name: [CUSTOMER_NAME]
Address: [PROPERTY_ADDRESS]
City: [CITY]
Phone: [PHONE]
Email: [EMAIL]

SEASONAL SERVICES INCLUDED:

SPRING (March - May):
✓ Spring Cleanup (one-time)
✓ Lawn Aeration
✓ Overseeding (as needed)
✓ Pre-Emergent Weed Control
✓ First Fertilization Application
✓ Mulch Refresh (garden beds)
✓ Pruning & Trimming

SUMMER (June - August):
✓ Regular Mowing ([FREQUENCY])
✓ Edge Trimming
✓ Weed Control Maintenance
✓ Fertilization (2 applications)
✓ Garden Bed Maintenance
✓ Hedge Trimming

FALL (September - November):
✓ Fall Cleanup
✓ Leaf Removal
✓ Final Fertilization
✓ Lawn Aeration
✓ Overseeding (as needed)
✓ Winter Preparation

WINTER (December - February):
✓ Snow Removal (if selected)
✓ Property Monitoring

SERVICE SCHEDULE:
- Service Season: [START_DATE] to [END_DATE]
- Mowing Frequency: [FREQUENCY]
- Preferred Service Day: [DAY_OF_WEEK]
- Service Time: [TIME_WINDOW]

PROPERTY DETAILS:
- Property Size: [PROPERTY_SIZE]
- Number of Trees: [NUMBER_OF_TREES]
- Garden Beds: [NUMBER_OF_BEDS]
- Special Instructions: [SPECIAL_INSTRUCTIONS]

PRICING:
- Seasonal Package Price: $[SEASONAL_PRICE]
- Payment Options:
  * Full payment upfront: 10% discount
  * Monthly payments: $[MONTHLY_PRICE]/month
  * Quarterly payments: $[QUARTERLY_PRICE]/quarter
- Payment Due: [PAYMENT_TERMS]

TERMS AND CONDITIONS:

1. SEASONAL SERVICE SCHEDULE
   - Services performed according to seasonal needs
   - Timing may vary based on weather conditions
   - Customer will be notified of service schedule
   - Some services are one-time seasonal applications

2. PAYMENT TERMS
   - Payment plan selected: [PAYMENT_PLAN]
   - Payments due as specified above
   - Late fees apply after 10 days
   - Service suspension for accounts 30+ days overdue

3. WEATHER DEPENDENCY
   - Services weather permitting
   - No charges for weather delays
   - Services resume automatically
   - Seasonal timing may vary

4. PROPERTY ACCESS
   - Customer provides access instructions
   - Secure pets during service
   - Remove obstacles from service areas
   - Contractor not responsible for inaccessible properties

5. ADDITIONAL SERVICES
   - Snow removal available separately
   - Emergency services available
   - Landscape projects quoted separately
   - Customer approval required for extras

6. CANCELLATION
   - 30-day written notice for cancellation
   - No refunds for completed services
   - Prorated refunds for unused services
   - Cancellation must be in writing

7. LIABILITY
   - Contractor fully insured
   - Customer removes valuable items
   - Not responsible for irrigation damage
   - Customer marks underground utilities

8. SATISFACTION
   - Quality guaranteed
   - Report issues within 24 hours
   - Free return visits for concerns
   - Regular communication maintained

CUSTOMER ACKNOWLEDGMENT:
By signing below, Customer acknowledges reading, understanding, and agreeing to all terms of this seasonal contract.

Customer Signature: _________________________ Date: ___________

Print Name: [CUSTOMER_NAME]

Contractor: Flora Lawn & Landscaping Inc.
Phone: (401) 389-0913
Email: floralawncareri@gmail.com

Contract Date: [CONTRACT_DATE]
Season: [SEASON_YEAR]
    `.trim()
  },

  commercial_contract: {
    title: 'Service Confirmation - Commercial Property',
    content: `
SERVICE CONFIRMATION

Thank you for choosing Flora Lawn & Landscaping! This document confirms the services we'll be providing for your commercial property.

CLIENT INFORMATION:
Business Name: [BUSINESS_NAME]
Contact Person: [CONTACT_NAME]
Address: [PROPERTY_ADDRESS]
City: [CITY]
Phone: [PHONE]
Email: [EMAIL]
Tax ID: [TAX_ID]

SERVICES INCLUDED:
✓ Regular Mowing ([FREQUENCY])
✓ Edge Trimming & String Trimming
✓ Blowing of parking lots, sidewalks, entrances
✓ Fertilization Program (4-6 applications/year)
✓ Weed Control (Pre & Post-Emergent)
✓ Lawn Aeration (Spring & Fall)
✓ Mulching (as needed)
✓ Shrub & Hedge Trimming
✓ Bed Maintenance
✓ Leaf Removal (Fall)
✓ Snow Removal (Winter - if selected)

SERVICE SCHEDULE:
- Frequency: [FREQUENCY]
- Service Days: [DAYS_OF_WEEK]
- Service Hours: [TIME_WINDOW]
- Start Date: [START_DATE]
- Contract Term: [CONTRACT_TERM] months

PROPERTY DETAILS:
- Property Size: [PROPERTY_SIZE]
- Number of Buildings: [NUMBER_OF_BUILDINGS]
- Parking Areas: [PARKING_AREAS]
- Special Requirements: [SPECIAL_REQUIREMENTS]

PRICING:
- Monthly Rate: $[MONTHLY_PRICE]
- Quarterly Rate: $[QUARTERLY_PRICE] (Save 5%)
- Annual Rate: $[ANNUAL_PRICE] (Save 10%)
- Payment Terms: Net 30 days
- Payment Methods: Check, ACH, or Credit Card

TERMS AND CONDITIONS:

1. SERVICE PERFORMANCE
   - Professional, efficient service delivery
   - Equipment maintained in excellent condition
   - Services performed during business hours or as agreed
   - Minimal disruption to business operations

2. PAYMENT TERMS
   - Invoices issued monthly
   - Payment due within 30 days of invoice date
   - Late fees: 1.5% per month on overdue accounts
   - Service suspension for accounts 60+ days overdue
   - Early payment discounts available

3. CONTRACT TERM & RENEWAL
   - Initial term: [CONTRACT_TERM] months
   - Auto-renewal for same term unless cancelled
   - 60-day written notice required for cancellation
   - Price adjustments may occur annually with 30-day notice

4. PROPERTY ACCESS & SECURITY
   - Client provides necessary access credentials
   - Contractor employees are background checked
   - Contractor follows all site security protocols
   - Client notified of any access issues

5. INSURANCE & LIABILITY
   - Contractor maintains:
     * General Liability: $2,000,000
     * Workers' Compensation: As required by law
     * Commercial Auto Insurance
   - Certificates of insurance available upon request
   - Contractor not liable for pre-existing conditions
   - Client responsible for marking utilities

6. ADDITIONAL SERVICES
   - Additional services quoted separately
   - Change orders require written approval
   - Emergency services available
   - Landscape projects quoted separately

7. QUALITY ASSURANCE
   - Regular quality inspections
   - Client satisfaction surveys
   - Issue resolution within 24 hours
   - Dedicated account manager

8. COMMUNICATION
   - Primary contact: [ACCOUNT_MANAGER]
   - Phone: (401) 389-0913
   - Email: floralawncareri@gmail.com
   - Regular service reports provided
   - Online portal for account management

9. WEATHER & FORCE MAJEURE
   - Services weather permitting
   - No charges for weather delays
   - Force majeure events excused
   - Services resume when conditions allow

10. TERMINATION
    - Either party may terminate with 60-day notice
    - Immediate termination for non-payment
    - Contractor may terminate for safety concerns
    - Final payment due upon termination

CLIENT ACKNOWLEDGMENT:
By signing below, Client acknowledges reading, understanding, and agreeing to all terms of this commercial contract.

Authorized Signature: _________________________ Date: ___________

Print Name: [CONTACT_NAME]
Title: [TITLE]

Contractor: Flora Lawn & Landscaping Inc.
License #: [LICENSE_NUMBER]
Phone: (401) 389-0913
Email: floralawncareri@gmail.com

Contract Date: [CONTRACT_DATE]
Contract Term: [START_DATE] to [END_DATE]
    `.trim()
  },

  simple_agreement: {
    title: 'Service Confirmation - Simple',
    content: `
SERVICE CONFIRMATION

Hi [CUSTOMER_NAME]!

Thank you for choosing Flora Lawn & Landscaping. Here's a summary of the services we'll be providing:

Customer: [CUSTOMER_NAME]
Address: [PROPERTY_ADDRESS]
Phone: [PHONE]
Email: [EMAIL]

Services We'll Provide:
[SELECTED_SERVICES_LIST]

Frequency: [FREQUENCY]
Start Date: [START_DATE]

Service Rate: $[MONTHLY_PRICE]
Payment: After service is completed (send it the next day or next week - whatever works for you!)

SERVICE DETAILS:
• Services performed as scheduled (weather permitting)
• Payment is due after service is completed - send it whenever convenient
• 24-hour notice to skip or reschedule
• Please ensure we have access to your property

Questions? Call (401) 389-0913

Thank you for choosing Flora Lawn & Landscaping!
    `.trim()
  }
};

// Helper function to replace placeholders in templates
export function fillContractTemplate(template, data) {
  let filledTemplate = template;
  
  // Create a map of all possible placeholders with their values
  const replacements = {
    'CUSTOMER_NAME': data.CUSTOMER_NAME || '[CUSTOMER_NAME]',
    'PROPERTY_ADDRESS': data.PROPERTY_ADDRESS || '[PROPERTY_ADDRESS]',
    'CITY': data.CITY || '[CITY]',
    'PHONE': data.PHONE || '[PHONE]',
    'EMAIL': data.EMAIL || '[EMAIL]',
    'PROPERTY_SIZE': data.PROPERTY_SIZE || '[PROPERTY_SIZE]',
    'FREQUENCY': data.FREQUENCY || '[FREQUENCY]',
    'DAY_OF_WEEK': data.DAY_OF_WEEK || '[DAY_OF_WEEK]',
    'START_DATE': data.START_DATE || '[START_DATE]',
    'MONTHLY_PRICE': data.MONTHLY_PRICE || '[MONTHLY_PRICE]',
    'SPECIAL_INSTRUCTIONS': data.SPECIAL_INSTRUCTIONS || '[SPECIAL_INSTRUCTIONS]',
    'SEASON': data.SEASON || 'Spring',
    'END_SEASON': data.END_SEASON || 'Fall',
    'TIME_WINDOW': data.TIME_WINDOW || '9 AM - 5 PM',
    'CONTRACT_DATE': data.CONTRACT_DATE || new Date().toLocaleDateString(),
    'END_DATE': data.END_DATE || '[END_DATE]',
    'LICENSE_NUMBER': data.LICENSE_NUMBER || '[LICENSE_NUMBER]',
    'BUSINESS_NAME': data.BUSINESS_NAME || '[BUSINESS_NAME]',
    'CONTACT_NAME': data.CONTACT_NAME || '[CONTACT_NAME]',
    'TAX_ID': data.TAX_ID || '[TAX_ID]',
    'SERVICES_LIST': data.SERVICES_LIST || '[SERVICES_LIST]',
  };
  
  // Replace placeholders one by one, using word boundaries to avoid partial replacements
  Object.keys(replacements).forEach(key => {
    const placeholder = `[${key}]`;
    const value = replacements[key];
    // Use a regex that matches the exact placeholder with brackets
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    filledTemplate = filledTemplate.replace(regex, value);
  });
  
  return filledTemplate;
}

// Get contract template by type
export function getContractTemplate(type = 'basic_weekly') {
  return CONTRACT_TEMPLATES[type] || CONTRACT_TEMPLATES.basic_weekly;
}

