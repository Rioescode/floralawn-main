import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { image, prompt } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert base64 image to the format Claude expects
    const imageData = image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageData,
              },
            },
            {
              type: "text",
              text: prompt || `Extract all text from this image and organize it into job notes. For each note you find, provide:
              1. A short title (max 50 characters)
              2. The full content/details
              3. Suggest a category: same_day, one_time, weekly, urgent, follow_up, or general
              4. Suggest a priority: high, medium, or low
              
              Format your response as a JSON array of objects with these fields: title, content, category, priority
              
              Example format:
              [
                {
                  "title": "Lawn mowing at 123 Main St",
                  "content": "Customer called about weekly lawn service. Large yard, needs edging too.",
                  "category": "weekly",
                  "priority": "medium"
                }
              ]
              
              If you can't find any clear job-related text, return an empty array. Only return the JSON array, no other text.`
            },
          ],
        },
      ],
    });

    const content = response.content[0].text;
    
    try {
      // Try to parse the JSON response
      const notes = JSON.parse(content);
      
      // Validate the structure
      if (Array.isArray(notes)) {
        const validNotes = notes.filter(note => 
          note.title && 
          typeof note.title === 'string' &&
          ['same_day', 'one_time', 'weekly', 'urgent', 'follow_up', 'general'].includes(note.category || 'general') &&
          ['high', 'medium', 'low'].includes(note.priority || 'medium')
        );
        
        return NextResponse.json({ notes: validNotes });
      } else {
        throw new Error('Invalid format');
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract notes from plain text
      console.log('JSON parsing failed, attempting text extraction:', content);
      
      // Simple fallback: create a single note with the extracted text
      const fallbackNote = {
        title: 'Extracted Text',
        content: content.substring(0, 500), // Limit content length
        category: 'general',
        priority: 'medium'
      };
      
      return NextResponse.json({ notes: [fallbackNote] });
    }

  } catch (error) {
    console.error('Error extracting text from image:', error);
    return NextResponse.json({ 
      error: 'Failed to extract text from image',
      details: error.message 
    }, { status: 500 });
  }
} 