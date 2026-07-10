'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrandedLoader } from '@/components/BrandedLoader';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, phone, university, expertise')
        .eq('id', session.user.id)
        .single();

      if (!profile || !profile.role) {
        router.push('/role-selection');
        return;
      }

      const { role, full_name, phone, university, expertise } = profile;
      const missingBasic = !full_name || !phone;
      const missingStudent = (role === 'student' && !university);
      const missingConsultant = (role === 'consultant' && !expertise);

      if (missingBasic || missingStudent || missingConsultant) {
        router.push('/profile-completion');
        return;
      }

      router.push(role === 'student' ? '/student-dashboard' : '/consultant-dashboard');
    };

    handleCallback();
  }, [router]);

  return <BrandedLoader message="Signing you in..." />;
}
