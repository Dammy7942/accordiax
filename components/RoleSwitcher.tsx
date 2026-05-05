'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

    // Redirect to the other dashboard
    router.push(newRole === 'student' ? '/student-dashboard' : '/consultant-dashboard');
    setLoading(false);
  };

  return (
    <button
      onClick={switchRole}
      disabled={loading}
      className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded transition disabled:opacity-50"
    >
      {loading ? 'Switching...' : `Switch to ${currentRole === 'student' ? 'Consultant' : 'Student'}`}
    </button>
  );
}