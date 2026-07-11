'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrandedLoader } from '@/components/BrandedLoader';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import Link from 'next/link';

type Role = 'student' | 'consultant';

interface ProfileData {
  full_name: string;
  phone: string;
  university: string;
  expertise: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toasts, toast, dismiss } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    full_name: '',
    phone: '',
    university: '',
    expertise: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { router.push('/login'); return; }
      setUserId(user.id);
      setEmail(user.email ?? '');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, phone, university, expertise')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.role) { router.push('/role-selection'); return; }

      setRole(profile.role as Role);
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        university: profile.university ?? '',
        expertise: profile.expertise ?? '',
      });
      setLoading(false);
    };
    load();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId || !role) return;

    if (!form.full_name.trim()) { toast('Full name is required.', 'error'); return; }
    if (!form.phone.trim()) { toast('Phone number is required.', 'error'); return; }
    if (role === 'student' && !form.university.trim()) { toast('University is required.', 'error'); return; }
    if (role === 'consultant' && !form.expertise.trim()) { toast('Area of expertise is required.', 'error'); return; }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        university: form.university.trim() || null,
        expertise: form.expertise.trim() || null,
      })
      .eq('id', userId);

    setSaving(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast('Profile updated successfully.', 'success');
    }
  };

  const dashboardPath = role === 'student' ? '/student-dashboard' : '/consultant-dashboard';

  if (loading) return <BrandedLoader message="Loading your profile..." />;

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Breadcrumb header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href={dashboardPath}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-800">My Profile</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Signed in as{' '}
            <span className="font-medium text-slate-700">{email}</span>
            {role && (
              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${role === 'student' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                {role === 'student' ? 'Student' : 'Consultant'}
              </span>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Basic Information</h2>
            <div className="space-y-4">
              <Input
                label="Full name"
                type="text"
                name="full_name"
                placeholder="Your full name"
                value={form.full_name}
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
                value={form.phone}
                onChange={handleChange}
                disabled={saving}
                autoComplete="tel"
                required
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
              {role === 'student' ? 'Academic Information' : 'Professional Information'}
            </h2>
            <div className="space-y-4">
              {role === 'student' && (
                <Input
                  label="University"
                  type="text"
                  name="university"
                  placeholder="Your university name"
                  value={form.university}
                  onChange={handleChange}
                  disabled={saving}
                  required
                />
              )}
              {role === 'consultant' && (
                <Input
                  label="Area of expertise"
                  type="text"
                  name="expertise"
                  placeholder="e.g., Engineering, Law, Medicine"
                  value={form.expertise}
                  onChange={handleChange}
                  disabled={saving}
                  required
                />
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" loading={saving} className="w-full">
              Save changes
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
