'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function useAuthRedirect(useSession = false) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      let userId: string | null = null;

      if (useSession) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); return; }
        userId = session.user.id;
      } else {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { router.push('/login'); return; }
        userId = user.id;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, phone, university, expertise')
        .eq('id', userId)
        .single();

      if (!profile?.role) {
        router.push('/role-selection');
        return;
      }

      const { role, full_name, phone, university, expertise } = profile;
      const missingBasic = !full_name || !phone;
      const missingRoleField =
        (role === 'student' && !university) ||
        (role === 'consultant' && !expertise);

      if (missingBasic || missingRoleField) {
        router.push('/profile-completion');
        return;
      }

      router.push(role === 'student' ? '/student-dashboard' : '/consultant-dashboard');
    };

    run();
  }, [router, useSession]);
}
