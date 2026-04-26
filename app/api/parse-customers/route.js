import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { aiApiLimiter } from '@/lib/rate-limiter';
import { validateCustomerData, sanitizeText } from '@/lib/validation';

export async function POST(request) {
  try {
    // Rate limiting
    const rateLimitResult = await aiApiLimiter(request);
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

    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Sanitize and validate input text
    const sanitizedText = sanitizeText(text, 10000); // Max 10KB of text
    
    if (sanitizedText.length < 10) {
      return NextResponse.json({ error: 'Text too short to parse' }, { status: 400 });
    }

    // Claude AI API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Parse this text and extract customer information. Return ONLY a JSON array of customer objects with these exact fields:
          - name (string, required)
          - email (string, can be empty)
          - phone (string, can be empty)
          - address (string, can be empty)
          - service_type (string, one of: 'lawn_mowing', 'lawn_care', 'landscaping', 'mulch_installation', 'spring_cleanup', 'fall_cleanup', default: 'lawn_mowing')
          - frequency (string, one of: 'weekly', 'bi_weekly', 'monthly', 'seasonal', 'one_time', default: 'weekly')
          - price (number, default: 50.00)
          - status (string, one of: 'active', 'pending', 'completed', 'cancelled', default: 'active')
          - notes (string, can be empty)

          Text to parse:
          ${sanitizedText}

          Return only the JSON array, no other text.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse the JSON response
    let customers;
    try {
      customers = JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        customers = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse customer data from AI response');
      }
    }

    // Validate each customer and sanitize data
    const validCustomers = [];
    const validationErrors = [];

    for (let i = 0; i < customers.length && i < 50; i++) { // Limit to 50 customers max
      const customer = customers[i];
      const { errors, sanitized } = validateCustomerData(customer);
      
      if (errors.length === 0) {
        validCustomers.push(sanitized);
      } else {
        validationErrors.push(`Customer ${i + 1}: ${errors.join(', ')}`);
      }
    }

    return NextResponse.json({ 
      customers: validCustomers,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined
    });

  } catch (error) {
    console.error('Error parsing customers:', error);
    return NextResponse.json({ 
      error: 'Failed to parse customer data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 