import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { area, breakdown, totalQuote } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    const breakdownText = breakdown.map(item => `- ${item.name}: $${item.price}`).join('\n');

    const prompt = `You are an expert landscaping quoting assistant for Flora Lawn & Landscaping. 
The user just generated a quote for their property.
Total Quote Price: $${totalQuote}

Service Breakdown:
${breakdownText}

Please write a brief, friendly 2-3 sentence summary explaining this quote to the customer. Mention the total price, the specific services included, and emphasize the transparency and value. Do NOT mention "satellite", "satellite measurement", or "satellite technology". Do not use generic greetings like "Dear Customer", just jump straight into the summary. Focus on explaining exactly what they are paying for and why it is a great value.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 150,
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
    console.error('Claude API Error:', error);
    return NextResponse.json({ error: String(error.message || error) }, { status: 500 });
  }
}
