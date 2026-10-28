import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import '@lovable.dev/cloud-auth-js/styles.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/PasswordInput';
import { accountDestination, passwordError } from '@/lib/account';

export default function AccountAccessForm({ initialMode = 'login', onSuccess }: { initialMode?: 'login' | 'signup' | 'forgot'; onSuccess?: () => void }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ email: '', password: '', confirmation: '', firstName: '', lastName: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verify, setVerify] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const field = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });
  const changeMode = (next: typeof mode) => { setMode(next); setError(''); setMessage(''); setVerify(false); };
  const finish = () => { onSuccess?.(); navigate(accountDestination(sessionStorage.getItem('pm_auth_destination'))); sessionStorage.removeItem('pm_auth_destination'); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setMessage('');
    if (mode === 'signup') { const problem = passwordError(form.password, form.confirmation); if (problem) { setError(problem); return; } }
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage('If an account exists for this email, a password reset link is on its way. Check your inbox and spam folder.');
      } else if (mode === 'signup') {
        const result = await register(form.email.trim(), form.password, form.firstName.trim(), form.lastName.trim());
        if (!result.success) throw new Error(result.error);
        if (result.needsConfirmation) { setVerify(true); setMessage('Check your inbox to confirm your email before signing in.'); setForm({ ...form, password: '', confirmation: '' }); }
        else finish();
      } else {
        const result = await login(form.email.trim(), form.password);
        if (!result.success) { if (result.error?.toLowerCase().includes('email not confirmed')) setVerify(true); throw new Error(result.error); }
        finish();
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const resend = async () => {
    setBusy(true); setError('');
    const { error } = await supabase.auth.resend({ type: 'signup', email: form.email.trim(), options: { emailRedirectTo: window.location.origin } });
    if (error) setError(error.message);
    else { setMessage('Confirmation email requested. Check your inbox and spam folder.'); setCooldown(true); window.setTimeout(() => setCooldown(false), 60000); }
    setBusy(false);
  };
  const social = async (provider: 'google' | 'lovable') => {
    setBusy(true); setError('');
    try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin }); if (result.error) throw result.error; if (!result.redirected) finish(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Sign-in could not be completed.'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-6">
    {mode !== 'forgot' && <div className="grid grid-cols-2 border-b border-border"><Button variant="ghost" className={mode === 'login' ? 'border-b-2 border-primary rounded-none' : 'text-muted-foreground'} onClick={() => changeMode('login')}>Sign in</Button><Button variant="ghost" className={mode === 'signup' ? 'border-b-2 border-primary rounded-none' : 'text-muted-foreground'} onClick={() => changeMode('signup')}>Create account</Button></div>}
    {mode === 'forgot' && <h2 className="text-2xl">Recover your account</h2>}
    {message && <div role="status" className="border border-border bg-muted p-4 rounded-md text-sm flex gap-3"><MailCheck className="h-5 w-5 shrink-0" /><p>{message}</p></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <form onSubmit={submit} className="space-y-4">
      {mode === 'signup' && !verify && <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="first-name">First name</Label><Input id="first-name" autoComplete="given-name" required maxLength={80} value={form.firstName} onChange={e => field('firstName', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="last-name">Last name</Label><Input id="last-name" autoComplete="family-name" required maxLength={80} value={form.lastName} onChange={e => field('lastName', e.target.value)} /></div></div>}
      <div className="space-y-2"><Label htmlFor="access-email">Email address</Label><Input id="access-email" type="email" autoComplete="email" required value={form.email} onChange={e => field('email', e.target.value)} /></div>
      {mode !== 'forgot' && !(verify && mode === 'signup') && <div className="space-y-2"><Label htmlFor="access-password">Password</Label><PasswordInput id="access-password" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'signup' ? 6 : undefined} value={form.password} onChange={e => field('password', e.target.value)} /></div>}
      {mode === 'signup' && !verify && <div className="space-y-2"><Label htmlFor="access-confirm">Confirm password</Label><PasswordInput id="access-confirm" autoComplete="new-password" required value={form.confirmation} onChange={e => field('confirmation', e.target.value)} /></div>}
      {!(verify && mode === 'signup') && <Button className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{mode === 'forgot' ? 'Send reset link' : mode === 'signup' ? 'Create account' : 'Sign in'}</Button>}
    </form>
    {verify && <Button variant="outline" className="w-full" disabled={busy || cooldown || !form.email} onClick={resend}>{cooldown ? 'Email requested — wait before resending' : 'Resend verification email'}</Button>}
    {mode === 'login' && <Button variant="link" className="w-full" onClick={() => changeMode('forgot')}>Forgot password?</Button>}
    {mode === 'forgot' ? <Button variant="link" onClick={() => changeMode('login')}>Back to sign in</Button> : <div className="space-y-3 border-t border-border pt-5"><Button variant="outline" className="w-full" disabled={busy} onClick={() => social('google')}>Continue with Google</Button><Button type="button" className="lovable-auth-button w-full" disabled={busy} onClick={() => social('lovable')}>Continue with Lovable</Button></div>}
  </div>;
}