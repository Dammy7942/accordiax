import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('payment_requests')
      .select(`
        id, amount, status, admin_notes, requested_at, processed_at,
        agreement:agreement_id ( id, requests ( title ) ),
        consultant:consultant_id ( id, full_name, email ),
        bank_account:bank_account_id ( bank_name, account_number, account_name )
      `)
      .order('requested_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, status, admin_notes } = await request.json();
    if (!id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const supabase = adminClient();
    const { error } = await supabase
      .from('payment_requests')
      .update({
        status,
        admin_notes: admin_notes ?? null,
        processed_at: ['approved', 'rejected', 'paid'].includes(status) ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
