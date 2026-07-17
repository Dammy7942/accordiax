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

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
}

const emptyAccountForm = { bank_name: '', account_number: '', account_name: '' };

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

  // Bank accounts (consultants only)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [addingAccount, setAddingAccount] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

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

      if (profile.role === 'consultant') {
        const { data: accounts } = await supabase
          .from('bank_accounts')
          .select('id, bank_name, account_number, account_name, is_default')
          .eq('consultant_id', user.id)
          .order('created_at', { ascending: true });
        setBankAccounts(accounts ?? []);
      }

      setLoading(false);
    };
    load();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (error) { toast(error.message, 'error'); } else { toast('Profile updated successfully.', 'success'); }
  };

  const handleAddAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    if (!accountForm.bank_name.trim()) { toast('Bank name is required.', 'error'); return; }
    if (!accountForm.account_number.trim()) { toast('Account number is required.', 'error'); return; }
    if (!accountForm.account_name.trim()) { toast('Account name is required.', 'error'); return; }

    setAddingAccount(true);
    const isFirst = bankAccounts.length === 0;
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        consultant_id: userId,
        bank_name: accountForm.bank_name.trim(),
        account_number: accountForm.account_number.trim(),
        account_name: accountForm.account_name.trim(),
        is_default: isFirst,
      })
      .select('id, bank_name, account_number, account_name, is_default')
      .single();

    setAddingAccount(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      setBankAccounts(prev => [...prev, data]);
      setAccountForm(emptyAccountForm);
      setShowAccountForm(false);
      toast('Bank account added.', 'success');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      toast(error.message, 'error');
    } else {
      const remaining = bankAccounts.filter(a => a.id !== id);
      // if deleted account was default, make the first remaining one default
      if (bankAccounts.find(a => a.id === id)?.is_default && remaining.length > 0) {
        await supabase.from('bank_accounts').update({ is_default: true }).eq('id', remaining[0].id);
        remaining[0].is_default = true;
      }
      setBankAccounts(remaining);
      toast('Bank account removed.', 'success');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!userId) return;
    setSettingDefaultId(id);
    // clear all defaults then set new one
    await supabase.from('bank_accounts').update({ is_default: false }).eq('consultant_id', userId);
    const { error } = await supabase.from('bank_accounts').update({ is_default: true }).eq('id', id);
    setSettingDefaultId(null);
    if (error) {
      toast(error.message, 'error');
    } else {
      setBankAccounts(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
      toast('Default account updated.', 'success');
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

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div>
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

        {/* Profile form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Basic Information</h2>
            <div className="space-y-4">
              <Input label="Full name" type="text" name="full_name" placeholder="Your full name"
                value={form.full_name} onChange={handleChange} disabled={saving} autoComplete="name" required />
              <Input label="Phone number" type="tel" name="phone" placeholder="e.g., 08012345678"
                value={form.phone} onChange={handleChange} disabled={saving} autoComplete="tel" required />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
              {role === 'student' ? 'Academic Information' : 'Professional Information'}
            </h2>
            <div className="space-y-4">
              {role === 'student' && (
                <Input label="University" type="text" name="university" placeholder="Your university name"
                  value={form.university} onChange={handleChange} disabled={saving} required />
              )}
              {role === 'consultant' && (
                <Input label="Area of expertise" type="text" name="expertise" placeholder="e.g., Engineering, Law, Medicine"
                  value={form.expertise} onChange={handleChange} disabled={saving} required />
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" loading={saving} className="w-full">Save changes</Button>
          </div>
        </form>

        {/* Bank accounts — consultants only */}
        {role === 'consultant' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Bank Accounts</h2>
                <p className="text-xs text-slate-400 mt-1">Payment requests use accounts saved here.</p>
              </div>
              {!showAccountForm && (
                <button
                  onClick={() => setShowAccountForm(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add account
                </button>
              )}
            </div>

            {/* Existing accounts */}
            {bankAccounts.length > 0 && (
              <div className="space-y-3 mb-6">
                {bankAccounts.map(account => (
                  <div key={account.id} className={`flex items-center justify-between p-4 rounded-xl border ${account.is_default ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{account.bank_name}</span>
                        {account.is_default && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{account.account_number} &middot; {account.account_name}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {!account.is_default && (
                        <button
                          onClick={() => handleSetDefault(account.id)}
                          disabled={settingDefaultId === account.id}
                          className="text-xs text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                        >
                          {settingDefaultId === account.id ? 'Saving...' : 'Set default'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deletingId === account.id}
                        className="text-xs text-rose-500 hover:text-rose-700 transition-colors disabled:opacity-50"
                      >
                        {deletingId === account.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bankAccounts.length === 0 && !showAccountForm && (
              <p className="text-sm text-slate-400 mb-4">No bank accounts saved yet. Add one to request payments.</p>
            )}

            {/* Add account form */}
            {showAccountForm && (
              <form onSubmit={handleAddAccount} className="border border-slate-200 rounded-xl p-5 space-y-4 mt-2">
                <h3 className="text-sm font-semibold text-slate-700">New bank account</h3>
                <Input
                  label="Bank name"
                  type="text"
                  placeholder="e.g., GTBank, OPay, Palmpay, Moniepoint"
                  value={accountForm.bank_name}
                  onChange={e => setAccountForm(prev => ({ ...prev, bank_name: e.target.value }))}
                  disabled={addingAccount}
                  required
                />
                <Input
                  label="Account number"
                  type="text"
                  placeholder="10-digit account number"
                  value={accountForm.account_number}
                  onChange={e => setAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                  disabled={addingAccount}
                  required
                />
                <Input
                  label="Account name"
                  type="text"
                  placeholder="Name on the account"
                  value={accountForm.account_name}
                  onChange={e => setAccountForm(prev => ({ ...prev, account_name: e.target.value }))}
                  disabled={addingAccount}
                  required
                />
                <div className="flex gap-3 pt-1">
                  <Button type="submit" loading={addingAccount} className="flex-1">Save account</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowAccountForm(false); setAccountForm(emptyAccountForm); }} disabled={addingAccount} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
