export async function generateNotes(serviceType, city, bookingType, template) {
  try {
    const response = await fetch('/api/generate-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceType,
        city,
        bookingType,
        template
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate notes');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error generating notes:', error);
    throw error;
  }
}

export async function generateThanks(customerName, serviceType, city, bookingType, date) {
  try {
    const response = await fetch('/api/generate-thanks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName,
        serviceType,
        city,
        bookingType,
        date
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate thank you message');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error generating thank you message:', error);
    throw error;
  }
} 