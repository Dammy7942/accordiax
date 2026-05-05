'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirect() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      // Wait a moment for the cookie to be fully set
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login');
        return;
      }

      // Fetch profile
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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}