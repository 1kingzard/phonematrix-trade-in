import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MailCheck } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PasswordInput from '@/components/PasswordInput';
import { passwordError } from '@/lib/account';

export default function AccountSettings() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ first_name: '', last_name: '', display_name: '', phone: '', address: '', preferred_currency: 'USD' });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [email, setEmail] = useState('');
  useEffect(() => { if (!isLoading && !user) navigate('/login?redirect=/account', { replace: true }); }, [user, isLoading, navigate]);
  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    supabase.from('profiles').select('first_name,last_name,display_name,phone,address,preferred_currency').eq('user_id', user.id).maybeSingle().then(({ data, error }) => {
      if (error) setError(error.message);
      else { if (data) setProfile({ first_name: data.first_name || '', last_name: data.last_name || '', display_name: data.display_name || '', phone: data.phone || '', address: data.address || '', preferred_currency: data.preferred_currency }); setLoaded(true); }
    });
  }, [user]);
  const run = async (action: () => PromiseLike<{ error: { message: string } | null }>, success: string) => {
    setBusy(true); setError(''); setMessage('');
    try { const { error } = await action(); if (error) setError(error.message); else setMessage(success); }
    catch { setError('Unable to save changes. Please try again.'); }
    finally { setBusy(false); }
  };
  if (!user) return null;
  const field = (key: keyof typeof profile, value: string) => setProfile({ ...profile, [key]: value });
  return <div className="min-h-screen"><Header /><main className="max-w-3xl mx-auto px-5 pt-28 pb-16"><p className="text-muted-foreground text-sm mb-2">PHONEMATRIX</p><h1 className="text-4xl mb-8">Account settings</h1><Tabs defaultValue="details" onValueChange={() => { setMessage(''); setError(''); }}><TabsList className="mb-6"><TabsTrigger value="details">Personal details</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger></TabsList>{message && <p role="status" className="bg-muted border border-border p-4 rounded-md mb-6">{message}</p>}{error && <p role="alert" className="text-destructive mb-6">{error}</p>}
    <TabsContent value="details"><form className="space-y-5" onSubmit={e => { e.preventDefault(); run(() => supabase.from('profiles').upsert({ user_id: user.id, ...profile }, { onConflict: 'user_id' }), 'Your account details have been saved.'); }}><div className="grid sm:grid-cols-2 gap-5">{(['first_name', 'last_name', 'display_name', 'phone'] as const).map(key => <div key={key} className="space-y-2"><Label htmlFor={key}>{key === 'first_name' ? 'First name' : key === 'last_name' ? 'Last name' : key === 'display_name' ? 'Display name' : 'Phone number'}</Label><Input id={key} type={key === 'phone' ? 'tel' : 'text'} maxLength={100} value={profile[key]} onChange={e => field(key, e.target.value)} /></div>)}</div><div className="space-y-2"><Label htmlFor="account-address">Address</Label><Input id="account-address" autoComplete="street-address" value={profile.address} onChange={e => field('address', e.target.value)} /></div><div className="space-y-2 max-w-xs"><Label>Preferred currency</Label><Select value={profile.preferred_currency} onValueChange={value => field('preferred_currency', value)}><SelectTrigger aria-label="Preferred currency"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD — US dollar</SelectItem><SelectItem value="JMD">JMD — Jamaican dollar</SelectItem></SelectContent></Select></div><Button disabled={busy || !loaded}>{busy ? 'Saving…' : 'Save details'}</Button></form></TabsContent>
    <TabsContent value="security" className="space-y-10"><section className="border-b border-border pb-8 space-y-4"><h2 className="text-2xl flex gap-2 items-center"><MailCheck />Email address</h2><p className="text-sm text-muted-foreground break-all">{user.email} · {user.email_confirmed_at ? 'Verified' : 'Not verified'}</p>{!user.email_confirmed_at && <Button variant="outline" disabled={busy} onClick={() => run(() => supabase.auth.resend({ type: 'signup', email: user.email || '', options: { emailRedirectTo: window.location.origin } }), 'Verification email requested. Check your inbox.')}>Resend verification</Button>}<form className="space-y-3" onSubmit={e => { e.preventDefault(); run(() => supabase.auth.updateUser({ email: email.trim() }, { emailRedirectTo: window.location.origin }), 'Check your email to confirm the address change.'); }}><Label htmlFor="new-email">New email address</Label><Input id="new-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /><Button variant="outline" disabled={busy || email.trim() === user.email}>Change email</Button></form></section>
    <section className="space-y-4"><h2 className="text-2xl flex gap-2 items-center"><ShieldCheck />Change password</h2><form className="space-y-4" onSubmit={e => { e.preventDefault(); const problem = passwordError(passwords.next, passwords.confirm); if (problem) { setError(problem); return; } run(async () => { const result = await supabase.auth.updateUser({ password: passwords.next, current_password: passwords.current }); if (!result.error) setPasswords({ current: '', next: '', confirm: '' }); return result; }, 'Your password has been changed.'); }}>{(['current', 'next', 'confirm'] as const).map(key => <div key={key} className="space-y-2"><Label htmlFor={`password-${key}`}>{key === 'current' ? 'Current password' : key === 'next' ? 'New password' : 'Confirm new password'}</Label><PasswordInput id={`password-${key}`} required autoComplete={key === 'current' ? 'current-password' : 'new-password'} value={passwords[key]} onChange={e => setPasswords({ ...passwords, [key]: e.target.value })} /></div>)}<Button disabled={busy}>Update password</Button></form></section><section className="border-t border-border pt-6"><Button variant="outline" disabled={busy} onClick={() => run(async () => { const result = await supabase.auth.signOut({ scope: 'global' }); if (!result.error) { await logout(); navigate('/login'); } return result; }, 'Signed out.')}>Sign out of all sessions</Button></section></TabsContent>
  </Tabs></main></div>;
}