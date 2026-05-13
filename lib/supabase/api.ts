import { createServerClient } from '@supabase/ssr';
import { type NextRequest } from 'next/server';

export const createApiClient = (request: NextRequest, response?: Response) => {
  // We need to create a mock response to satisfy the setAll signature
  let supabaseResponse = response ?? new Response();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // For API routes, we don't need to set cookies, but the function must exist
          // We can optionally update the response if we need to set cookies (not needed here)
          cookiesToSet.forEach(({ name, value, options }) => {
            // If we had a response object, we could set cookies
          });
        },
      },
    }
  );

  return supabase;
};