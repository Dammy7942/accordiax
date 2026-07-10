'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrandedLoader } from '@/components/BrandedLoader';
import Link from 'next/link';

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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, phone, university, expertise')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.role) {
        router.push('/role-selection');
        return;
      }
      setRole(profile.role as 'student' | 'consultant');

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    return <BrandedLoader message="Loading your profile..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 tracking-tight"
          >
            Accordiax
          </Link>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-1.5 w-10 rounded-full bg-indigo-600" />
            <div className="h-1.5 w-10 rounded-full bg-indigo-600" />
            <div className="h-1.5 w-10 rounded-full bg-indigo-600 ring-2 ring-indigo-200 ring-offset-1" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Step 2 of 2</p>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Complete your profile</h1>
          <p className="text-slate-500 text-sm">
            Setting up as a{' '}
            <span className={`font-semibold ${role === 'student' ? 'text-indigo-600' : 'text-purple-600'}`}>
              {role === 'student' ? 'Student' : 'Consultant'}
            </span>
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full name"
              type="text"
              name="full_name"
              placeholder="Your full name"
              value={formData.full_name}
              onChange={handleChange}
              disabled={saving}
              autoComplete="name"
              required
            />
            <Input
              label="Phone number"
              type="tel"
              name="phone"
              placeholder="e.g., 08012345678"
              value={formData.phone}
              onChange={handleChange}
              disabled={saving}
              autoComplete="tel"
              required
            />
            {role === 'student' && (
              <Input
                label="University"
                type="text"
                name="university"
                placeholder="Your university name"
                value={formData.university}
                onChange={handleChange}
                disabled={saving}
                required
              />
            )}
            {role === 'consultant' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Areas of expertise
                </label>
                <textarea
                  name="expertise"
                  placeholder="e.g., Project supervision, Admission guidance, Assignment help"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none text-slate-800 text-sm"
                  rows={3}
                  value={formData.expertise}
                  onChange={handleChange}
                  disabled={saving}
                  required
                />
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              loading={saving}
              className="w-full mt-2"
            >
              {saving ? 'Saving...' : 'Continue to dashboard'}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
