const BREVO_API_KEY = process.env.BREVO_API_KEY;

export async function sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY missing');
    return false;
  }
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: 'noreply@accordiax.com', name: 'Accordiax' },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo error:', errorData);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Email send failed:', err);
    return false;
  }
}