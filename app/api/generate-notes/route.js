import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { aiApiLimiter } from '@/lib/rate-limiter';
import { sanitizeText } from '@/lib/validation';

export async function POST(req) {
  try {
    // Rate limiting
    const rateLimitResult = await aiApiLimiter(req);
    if (rateLimitResult) return rateLimitResult;

    // Authentication check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { serviceType, city, bookingType, template } = await req.json();

    // Input validation
    if (!serviceType || !city || !bookingType || !template) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedServiceType = sanitizeText(serviceType, 100);
    const sanitizedCity = sanitizeText(city, 100);
    const sanitizedBookingType = sanitizeText(bookingType, 50);
    const sanitizedTemplate = sanitizeText(template, 1000);

    // Validate service type
    const validServiceTypes = ['lawn_mowing', 'lawn_care', 'landscaping', 'mulch_installation', 'spring_cleanup', 'fall_cleanup'];
    if (!validServiceTypes.includes(sanitizedServiceType)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      );
    }

    // Validate booking type
    const validBookingTypes = ['one_time', 'weekly', 'bi_weekly', 'monthly', 'seasonal'];
    if (!validBookingTypes.includes(sanitizedBookingType)) {
      return NextResponse.json(
        { error: 'Invalid booking type' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Fill in the placeholders in this template for a ${sanitizedServiceType} service request in ${sanitizedCity} (${sanitizedBookingType}). Template: "${sanitizedTemplate}". Use realistic details and common service frequencies. Keep it brief and natural.`
        }],
        system: "You are writing from the customer's perspective. Fill in the template placeholders with realistic details that match the service type and location. Use common property sizes and service frequencies. Write in a natural, conversational style."
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', errorData);
      return NextResponse.json(
        { error: `Failed to generate notes: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Sanitize response
    const sanitizedText = sanitizeText(data.content[0].text, 2000);
    
    return NextResponse.json({ text: sanitizedText });
  } catch (error) {
    console.error('Error in generate-notes API:', error);
    return NextResponse.json(
      { error: 'Failed to generate notes' },
      { status: 500 }
    );
  }
} 