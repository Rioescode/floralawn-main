import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { currentSubject, currentBody, leadData, instructions } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key is not configured' },
        { status: 500 }
      );
    }

    const leadContext = `
      Current Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}
      Customer Name: ${leadData.customer_name || 'Not provided'}
      Service Requested: ${leadData.service_type || 'Not provided'}
      City: ${leadData.city || 'Not provided'}
      Address: ${leadData.address || 'Not provided'}
      Customer Notes/Message: ${leadData.notes || 'No extra notes'}
    `;

    const prompt = `
      Rewrite the following email to be more professional, warm, and highly personalized for the customer.
      
      Current Subject: ${currentSubject}
      Current Body: ${currentBody}
      
      User Instructions (PRIORITY):
      ${instructions || 'No specific instructions provided. Just optimize the existing content.'}
      
      Lead Context:
      ${leadContext}
      
      Requirements:
      1. Keep it professional and EXTREMELY BRIEF (Flora Lawn & Landscaping Inc tone).
      2. Maximum 3-4 sentences total.
      3. Use PROFESSIONAL SPACING: Double line breaks between the greeting, body, and sign-off.
      4. No fluff: Just acknowledge the request and offer the visit.
      5. Mention the specific service and city briefly.
      6. Return the response in a JSON format with 'subject' and 'body' fields.
      
      JSON Format Example:
      {
        "subject": "New Subject Line",
        "body": "Hi [Name],\n\n[Body text here].\n\nBest regards,\nFlora Lawn & Landscaping Inc."
      }
    `;

    console.log('AI Rewrite Request:', { leadData, currentSubject });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: prompt
        }],
        system: "You are an expert copywriter for Flora Lawn & Landscaping Inc. Your task is to rewrite customer emails to be more engaging and personalized. Always respond with a valid JSON object containing 'subject' and 'body' fields. Use double newlines (\\n\\n) between paragraphs, the greeting, and the sign-off for professional spacing. Do not include any other text in your response."
      })
    });

    console.log('Claude API Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', errorData);
      return NextResponse.json(
        { error: `Failed to generate rewrite: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    let content = data.content[0].text;
    console.log('Claude Raw Content:', content);
    
    // Strip markdown code blocks if present
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      content = content.split('```')[1].split('```')[0].trim();
    }
    
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      // Fallback: return the raw text if parsing fails (though the prompt asks for JSON)
      return NextResponse.json({ 
        subject: currentSubject,
        body: content 
      });
    }
  } catch (error) {
    console.error('Error in rewrite-email API:', error);
    return NextResponse.json(
      { error: 'Failed to rewrite email' },
      { status: 500 }
    );
  }
}
