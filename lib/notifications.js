export async function sendNotification(message) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Notification API error:', data);
      return false;
    }

    return data.sent;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
} 