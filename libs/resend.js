import { Resend } from "resend";
import config from "@/config";

let resend = null;

// Lazy initialization - only create Resend client when actually needed
function getResendClient() {
  if (resend) {
    return resend;
  }
  
  // Check for RESEND_API_KEY - log for debugging
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error("❌ RESEND_API_KEY is not set!");
    console.error("Environment check:", {
      NODE_ENV: process.env.NODE_ENV,
      hasKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('RESEND'))
    });
    return null;
  }
  
  // Validate API key format (Resend keys start with 're_')
  if (!apiKey.startsWith('re_')) {
    console.error("❌ RESEND_API_KEY appears invalid (should start with 're_')");
    console.error("Key preview:", apiKey.substring(0, 10) + '...');
    return null;
  }
  
  try {
    resend = new Resend(apiKey);
    console.log("✅ Resend client initialized successfully");
    return resend;
  } catch (error) {
    console.error("❌ Failed to initialize Resend client:", error);
    return null;
  }
}

/**
 * Sends an email using the provided parameters.
 *
 * @async
 * @param {Object} params - The parameters for sending the email.
 * @param {string | string[]} params.to - The recipient's email address or an array of email addresses.
 * @param {string} params.subject - The subject of the email.
 * @param {string} params.text - The plain text content of the email.
 * @param {string} params.html - The HTML content of the email.
 * @param {string} [params.replyTo] - The email address to set as the "Reply-To" address.
 * @returns {Promise<Object>} A Promise that resolves with the email sending result data.
 */
export const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  // During build time, skip silently
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn("⚠️ Skipping email send during build - RESEND_API_KEY not available");
    return { id: 'build-skip', message: 'Email skipped during build' };
  }
  
  const resendClient = getResendClient();
  
  if (!resendClient) {
    const error = new Error("RESEND_API_KEY is not configured or invalid. Please check your environment variables.");
    console.error("❌ Cannot send email:", error.message);
    console.error("📋 Debug info:", {
      hasEnvKey: !!process.env.RESEND_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    throw error;
  }

  const fromEmail = config.resend.fromAdmin || `${config.resend.fromName} <${config.resend.fromEmail}>`;
  
  console.log("📧 Attempting to send email via Resend:", {
    from: fromEmail,
    to,
    subject
  });

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://floralawn-and-landscaping.com';
    const emailAddress = Array.isArray(to) ? to[0] : to;
    
    // Add headers for better deliverability (helps avoid promotions folder)
    const headers = {
      'List-Unsubscribe': `<${baseUrl}/unsubscribe?email=${encodeURIComponent(emailAddress)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      'Precedence': 'bulk', // Helps email clients categorize
    };

    const emailPayload = {
      from: fromEmail,
      to,
      subject,
      text,
      html,
      ...(replyTo && { replyTo }),
      headers,
    };

    console.log("📧 Resend API payload:", {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      hasText: !!emailPayload.text,
      hasHtml: !!emailPayload.html,
      hasReplyTo: !!emailPayload.replyTo
    });

    const { data, error } = await resendClient.emails.send(emailPayload);

    if (error) {
      console.error("❌ Resend API error:", JSON.stringify(error, null, 2));
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        status: error.statusCode || error.status
      });
      throw new Error(`Resend API error: ${error.message || JSON.stringify(error)}`);
    }

    console.log("✅ Email sent successfully via Resend:", {
      id: data?.id,
      from: fromEmail,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject
    });
    return data;
  } catch (error) {
    console.error("❌ Error sending email via Resend:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};
