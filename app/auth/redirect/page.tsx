'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandedLoader } from '@/components/BrandedLoader';

export default function AuthRedirect() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, phone, university, expertise')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.role) {
        router.push('/role-selection');
        return;
      }

      const { role, full_name, phone, university, expertise } = profile;
      const isStudent = role === 'student';
      const isConsultant = role === 'consultant';
      const missingBasic = !full_name || !phone;
      const missingStudentSpecific = isStudent && !university;
      const missingConsultantSpecific = isConsultant && !expertise;

      if (missingBasic || missingStudentSpecific || missingConsultantSpecific) {
        router.push('/profile-completion');
        return;
      }

      router.push(role === 'student' ? '/student-dashboard' : '/consultant-dashboard');
    };

    if (!checked) {
      handleRedirect();
      setChecked(true);
    }
  }, [router, checked]);

  return <BrandedLoader message="Signing you in..." />;
}
