import { NextResponse } from 'next/server';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://accordiax.vercel.app';

export async function POST(request: Request) {
  try {
    const { to, subject, htmlContent } = await request.json();
    if (!to || !subject || !htmlContent) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

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
      console.error('Brevo email error:', errorData);
      return NextResponse.json({ error: 'Email service error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Email API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}