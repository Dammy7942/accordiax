'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface RoleSwitcherProps {
  currentRole: 'student' | 'consultant';
}

export default function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const switchRole = async () => {
    if (loading) return;
    setLoading(true);

    const newRole = currentRole === 'student' ? 'consultant' : 'student';

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id);

    if (error) {
      alert('Error switching role: ' + error.message);
      setLoading(false);
      return;
    }

    router.push(newRole === 'student' ? '/student-dashboard' : '/consultant-dashboard');
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={switchRole}
      loading={loading}
    >
      Switch to {currentRole === 'student' ? 'Consultant' : 'Student'}
    </Button>
  );
}