import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { area, breakdown = [], totalQuote } = await request.json();

    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

    if (!deepseekKey && !anthropicKey) {
      return NextResponse.json({ error: 'AI API key is not configured' }, { status: 500 });
    }

    const breakdownText = (breakdown || [])
      .map(item => `- ${item.name || item.description || 'Service'}: $${item.price || item.amount || 0}`)
      .join('\n');

    const prompt = `You are an expert landscaping quoting and invoicing assistant for Flora Lawn & Landscaping. 
The invoice/quote details are:
Total Price: $${totalQuote}

Service Breakdown:
${breakdownText || 'General landscaping services'}

Please write a brief, friendly 2-3 sentence summary explaining this quote/invoice to the customer. Mention the total price, the specific services included, and emphasize transparency, value, and peace of mind (backed by 100+ verified 5-star reviews across Google [4.9★] & Thumbtack [4.8★], plus our 100% satisfaction guarantee). Do NOT mention "satellite", "satellite measurement", or "satellite technology". Do not use generic greetings like "Dear Customer", just jump straight into the summary. Focus on explaining exactly what they are receiving and why it is a trusted, high-value choice.`;

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
              content: 'You are an expert landscaping quoting and invoicing assistant for Flora Lawn & Landscaping. Jump straight into the summary with no generic greeting. Keep it polished, concise (2-3 sentences), and highlight the value and services.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.6
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API Error in quote-summary:', errorText);
        return NextResponse.json({ error: `DeepSeek Error: ${response.status} ${errorText}` }, { status: response.status });
      }

      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content?.trim() || '';
      return NextResponse.json({ summary });
    }

    // Anthropic Fallback
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 250,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API Error:', errorText);
      return NextResponse.json({ error: `API Error: ${response.status} ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ summary: data.content[0].text });

  } catch (error) {
    console.error('Quote summary API Error:', error);
    return NextResponse.json({ error: String(error.message || error) }, { status: 500 });
  }
}
