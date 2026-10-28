import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/PasswordInput';
import { passwordError } from '@/lib/account';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    const recovery = window.location.hash.includes('type=recovery') || sessionStorage.getItem('pm_password_recovery') === 'true';
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') { sessionStorage.setItem('pm_password_recovery', 'true'); setReady(true); setChecking(false); }
    });
    supabase.auth.getUser().then(({ data, error }) => { setReady(recovery && !!data.user && !error); setChecking(false); });
    return () => subscription.unsubscribe();
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); const problem = passwordError(password, confirmation); if (problem) { setError(problem); return; }
    if (!ready) return;
    setBusy(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else { sessionStorage.removeItem('pm_password_recovery'); setPassword(''); setConfirmation(''); setDone(true); await supabase.auth.signOut(); }
    setBusy(false);
  };
  return <main className="min-h-screen px-5 py-20"><div className="max-w-md mx-auto space-y-6"><Link to="/" className="text-muted-foreground">PhoneMatrix</Link><h1 className="text-4xl">Set a new password</h1>{checking ? <p>Checking reset link…</p> : done ? <><p role="status">Your password has been updated.</p><Button asChild><Link to="/login">Sign in</Link></Button></> : ready ? <form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="reset-password">New password</Label><PasswordInput id="reset-password" autoComplete="new-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="reset-confirm">Confirm new password</Label><PasswordInput id="reset-confirm" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>{error && <p role="alert" className="text-destructive">{error}</p>}<Button disabled={busy} className="w-full">{busy ? 'Updating…' : 'Update password'}</Button></form> : <><p role="alert">This reset link is missing, expired, or has already been used.</p><Button asChild><Link to="/forgot-password">Request a new reset link</Link></Button></>}</div></main>;
}