'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileCompletion() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'consultant' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    university: '',
    expertise: '',
  });

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Get role and existing profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, phone, university, expertise')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.role) {
        // No role set – go back to role selection
        router.push('/role-selection');
        return;
      }
      setRole(profile.role as 'student' | 'consultant');

      // Pre-fill existing data if any
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        university: profile.university || '',
        expertise: profile.expertise || '',
      });
      setLoading(false);
    };
    fetchUserAndProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !role) return;
    setSaving(true);
    setError('');

    if (!formData.full_name.trim()) {
      setError('Full name is required.');
      setSaving(false);
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      setSaving(false);
      return;
    }
    if (role === 'student' && !formData.university.trim()) {
      setError('University name is required for students.');
      setSaving(false);
      return;
    }
    if (role === 'consultant' && !formData.expertise.trim()) {
      setError('Area of expertise is required for consultants.');
      setSaving(false);
      return;
    }

    // Update only the profile fields (do NOT touch role)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        university: formData.university || null,
        expertise: formData.expertise || null,
      })
      .eq('id', userId);

    if (updateError) {
      setError(updateError.message);
    } else {
      router.push(role === 'student' ? '/student-dashboard' : '/consultant-dashboard');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Complete Your Profile</h1>
        <p className="text-center text-gray-600 mb-6">
          As a {role === 'student' ? 'Student' : 'Consultant'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="full_name"
            placeholder="Full name"
            className="w-full p-3 border border-gray-300 rounded-xl mb-4 text-gray-800"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone number (e.g., 08012345678)"
            className="w-full p-3 border border-gray-300 rounded-xl mb-4 text-gray-800"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          {role === 'student' && (
            <input
              type="text"
              name="university"
              placeholder="University name"
              className="w-full p-3 border border-gray-300 rounded-xl mb-4 text-gray-800"
              value={formData.university}
              onChange={handleChange}
              required
            />
          )}
          {role === 'consultant' && (
            <textarea
              name="expertise"
              placeholder="Areas of expertise (e.g., Project supervision, Admission guidance, Assignment help)"
              className="w-full p-3 border border-gray-300 rounded-xl mb-4 text-gray-800"
              rows={2}
              value={formData.expertise}
              onChange={handleChange}
              required
            />
          )}
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-xl transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}