import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { name, service, address, city, state, assessmentData, estimatePreference } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key is not configured' },
        { status: 500 }
      );
    }

    const context = `
      Customer Name: ${name || 'Valued Customer'}
      Service: ${service || 'Lawn Care'}
      Location: ${city || ''}, ${state || ''} (${address || 'Address provided'})
      Preference: ${estimatePreference === 'meet_person' ? 'Meet in person' : 'Remote walk-around'}
      Assessment: ${JSON.stringify(assessmentData || {})}
    `;

    const prompt = `
      Draft a brief, professional description of work for a customer inquiry. 
      The customer, ${name || 'a homeowner'}, is requesting ${service} in ${city}.
      
      Context:
      ${context}
      
      Requirements:
      1. Write from the perspective of the CUSTOMER (${name || 'homeowner'}) describing what they need.
      2. Keep it to 2-3 concise sentences.
      3. Explicitly mention the specific service (${service}), the city (${city}), and the property address if provided.
      4. If cleanup condition is heavy/severe, mention that the property needs extra attention.
      5. Sound professional and direct.
      6. Return ONLY the drafted text. No greeting, no sign-off.
    `;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: prompt
        }],
        system: "You are a professional assistant for Flora Lawn & Landscaping. You help customers draft their service requests clearly and professionally."
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API Error:', errorText);
      return NextResponse.json({ error: 'AI Generation Failed' }, { status: response.status });
    }

    const data = await response.json();
    const draftedText = data.content[0].text.trim();

    return NextResponse.json({ draft: draftedText });
  } catch (error) {
    console.error('Error in draft-message API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
