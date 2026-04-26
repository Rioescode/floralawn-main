// Twilio SMS service - Server-side only
// Install: npm install twilio
'use server';

let twilioClient = null;

export async function sendSMS(to, message) {
  try {
    // Check if Twilio is configured (support both API Key and Auth Token methods)
    const hasApiKey = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_API_KEY_SID && process.env.TWILIO_API_KEY_SECRET;
    const hasAuthToken = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
    
    if (!hasApiKey && !hasAuthToken) {
      throw new Error('Twilio not configured');
    }

    // Lazy load Twilio to avoid errors if not installed
    if (!twilioClient) {
      // Use require for server-side only (prevents webpack bundling)
      const twilio = require('twilio');
      
      // Use API Key method (preferred) if available, otherwise fall back to Auth Token
      if (hasApiKey) {
        // API Key method: (apiKeySid, apiKeySecret, { accountSid })
        twilioClient = twilio(
          process.env.TWILIO_API_KEY_SID,
          process.env.TWILIO_API_KEY_SECRET,
          {
            accountSid: process.env.TWILIO_ACCOUNT_SID
          }
        );
      } else {
        // Auth Token method: (accountSid, authToken)
        twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
      }
    }

    // Format phone number (remove non-digits, ensure +1 prefix for US)
    const phoneNumber = to.replace(/\D/g, '');
    const formattedNumber = phoneNumber.startsWith('1') && phoneNumber.length === 11
      ? `+${phoneNumber}`
      : phoneNumber.length === 10
      ? `+1${phoneNumber}`
      : to;

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      to: formattedNumber
    });

    return {
      success: true,
      sid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

