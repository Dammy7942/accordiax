// app/api/admin/escrow/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // Use the Admin client to perform a raw SQL join.
    // This avoids the need for a formal foreign key relationship.
    const { data, error } = await supabaseAdmin
      .from('agreements')
      .select(`
        id,
        price,
        paystack_ref,
        status,
        payment_released,
        consultant_id,
        requests ( title )
      `)
      .eq('status', 'completed')
      .eq('payment_released', false);

    if (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to ensure a consistent structure.
    // This handles cases where the join returns 'null' for the request.
    const transformedData = data.map(agreement => ({
      ...agreement,
      requests: {
        title: agreement.requests?.title || 'Untitled Request'
      }
    }));

    return NextResponse.json(transformedData);
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}