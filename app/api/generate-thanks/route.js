import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { customerName, serviceType, city, bookingType, date } = await req.json();

    if (!customerName || !serviceType || !city || !bookingType || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
          content: `Write a warm, personalized thank you message for ${customerName} who just booked a ${serviceType} service with Flora Lawn & Landscaping Inc in ${city}. This is for a ${bookingType} scheduled for ${date}. Make it very personal, mention their name, service details, and location. Express genuine appreciation and make them feel valued. Include a note about the Flora team confirming details soon.`
        }],
        system: "You are writing highly personalized thank you messages for Flora Lawn & Landscaping Inc. Write in a warm, friendly tone that makes customers feel special and valued. Always start with their name. Keep it to 3-4 sentences, mentioning their specific service details and appointment time. End with a note about the Flora team confirming details soon. Never mention any other company names."
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', errorData);
      return NextResponse.json(
        { error: `Failed to generate message: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.content[0].text });
  } catch (error) {
    console.error('Error in generate-thanks API:', error);
    return NextResponse.json(
      { error: 'Failed to generate thank you message' },
      { status: 500 }
    );
  }
} 