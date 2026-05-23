import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Get appealed agreements
  const { data: agreements, error: agreementsError } = await supabaseAdmin
    .from('agreements')
    .select('id, request_id, consultant_id, dispute_reason, dispute_details, appeal_reason, appeal_details, appeal_raised_at, status')
    .eq('status', 'appealed')
    .order('appeal_raised_at', { ascending: false });

  if (agreementsError) {
    console.error('Agreements error:', agreementsError);
    return NextResponse.json({ error: agreementsError.message }, { status: 500 });
  }

  if (!agreements || agreements.length === 0) {
    return NextResponse.json([]);
  }

  // 2. Fetch request titles and student_ids
  const requestIds = agreements.map(a => a.request_id);
  const { data: requests, error: requestsError } = await supabaseAdmin
    .from('requests')
    .select('id, title, student_id')
    .in('id', requestIds);
  if (requestsError) {
    console.error('Requests error:', requestsError);
    return NextResponse.json({ error: requestsError.message }, { status: 500 });
  }
  const requestMap = new Map(requests?.map(r => [r.id, r]) || []);

  // 3. Fetch consultant full names from profiles
  const consultantIds = [...new Set(agreements.map(a => a.consultant_id))];
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .in('id', consultantIds);
  if (profilesError) {
    console.error('Profiles error:', profilesError);
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }
  const nameMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

  // 4. Fetch consultant emails via Admin API
  const emailMap = new Map<string, string>();
  try {
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) {
      console.error('Users error:', usersError);
    } else {
      users.filter(u => consultantIds.includes(u.id)).forEach(u => emailMap.set(u.id, u.email ?? ''));
    }
  } catch (err) {
    console.error('Failed to fetch users:', err);
  }

  // 5. Build enriched response
  const enriched = agreements.map(ag => {
    const req = requestMap.get(ag.request_id);
    return {
      ...ag,
      requests: req ? { title: req.title, student_id: req.student_id } : null,
      consultant: {
        full_name: nameMap.get(ag.consultant_id) || 'Unknown',
        email: emailMap.get(ag.consultant_id) || 'Unknown'
      }
    };
  });

  return NextResponse.json(enriched);
}