import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!deepseekKey && !anthropicKey) {
      console.error("AI API key is missing");
      return NextResponse.json({ 
        error: 'Configuration Error', 
        details: 'Server is missing AI Authentication Key (DEEPSEEK_API_KEY or ANTHROPIC_API_KEY).' 
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
4. Return ONLY the HTML code without markdown code blocks.`;

    if (deepseekKey) {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert invoice designer for Flora Lawn & Landscaping. You generate clean, semantic HTML invoices with emerald styling. Return ONLY the HTML markup without markdown backticks or commentary.'
            },
            { role: 'user', content: enhancedPrompt }
          ],
          max_tokens: 3500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API Error:', errorText);
        return NextResponse.json({ 
          error: 'AI Engine Error', 
          details: `The AI Engine returned an error: ${errorText}` 
        }, { status: response.status });
      }

      const data = await response.json();
      let invoiceHTML = data.choices?.[0]?.message?.content || '';
      invoiceHTML = invoiceHTML.replace(/^```(?:html)?\s*/i, '').replace(/```$/i, '').trim();

      return NextResponse.json({ 
        invoice: invoiceHTML,
        success: true 
      });
    }

    // Direct HTTP call to Anthropic as fallback
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
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
