import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is missing");
      return NextResponse.json({ 
        error: 'Configuration Error', 
        details: 'Server is missing the AI Authentication Key.' 
      }, { status: 500 });
    }

    const { prompt, invoiceData } = await request.json();

    // Company information (Branded Flora Elite)
    const companyInfo = {
      name: 'Flora Lawn & Landscaping Inc.',
      address: '45 Vernon St, Pawtucket, RI 02860',
      phone: '(401) 389-0913',
      email: 'floralawncareri@gmail.com',
      logo: 'https://floralawn-and-landscaping.com/flora-logo-final.png'
    };

    const enhancedPrompt = `${prompt}

Please return a professional invoice formatted as clean HTML.
Guidelines:
1. Include the logo at the top: <img src="${companyInfo.logo}" style="max-height: 100px; margin-bottom: 20px;" />
2. Include branding info:
   - ${companyInfo.name}
   - ${companyInfo.address}
   - Phone: ${companyInfo.phone}
   - Email: ${companyInfo.email}
3. Use a clean, modern design with greens (Emerald-600) for a premium Flora theme.
4. Return ONLY the HTML.`;

    // Direct HTTP call to Anthropic to avoid SDK dependency/connection issues
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 4000,
        messages: [{ role: 'user', content: enhancedPrompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', errorText);
      return NextResponse.json({ 
        error: 'AI Engine Error', 
        details: `The AI Engine returned an error: ${errorText}` 
      }, { status: response.status });
    }

    const data = await response.json();
    const invoiceHTML = data.content[0].text;

    return NextResponse.json({ 
      invoice: invoiceHTML,
      success: true 
    });

  } catch (error) {
    console.error('SERVER ELITE ERROR:', error);
    return NextResponse.json({ 
      error: 'Failed to generate invoice',
      details: error.message || 'Unknown Error',
      stack: error.stack
    }, { status: 500 });
  }
} 