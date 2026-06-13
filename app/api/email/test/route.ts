// app/api/email/test/route.ts
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
export async function GET() {
  const ok = await sendEmail('your-email@example.com', 'Test', '<p>Test</p>');
  return NextResponse.json({ ok });
}