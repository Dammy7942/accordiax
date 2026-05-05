import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Callback error:', error);
      // Redirect to login with error message
      return NextResponse.redirect(new URL('/login?error=session_expired', request.url));
    }
  }

  // After successful exchange, redirect to role selection
  return NextResponse.redirect(new URL('/role-selection', request.url));
}