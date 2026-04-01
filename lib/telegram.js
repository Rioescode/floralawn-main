export async function sendTelegramNotification(message) {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    console.warn('Telegram notification attempted on client-side, skipping');
    return null;
  }

  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log('Sending Telegram notification with token present:', !!token, 'chatId present:', !!chatId);

  if (!token || !chatId) {
    console.error('Telegram credentials not found in environment variables');
    return null;
  }

  try {
    const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    console.log('Making request to Telegram API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    console.log('Telegram API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Telegram API error response:', errorData);
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Telegram notification sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    // Don't throw error to prevent breaking the main flow
    return null;
  }
} 