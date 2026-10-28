import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import AccountAccessForm from '@/components/AccountAccessForm';
import { accountDestination } from '@/lib/account';

export default function LoginPage({ initialMode = 'login' }: { initialMode?: 'login' | 'signup' | 'forgot' }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const logo = useSiteLogo();
  useEffect(() => {
    const next = params.get('redirect');
    if (next) sessionStorage.setItem('pm_auth_destination', accountDestination(next));
    if (user && !isLoading) {
      if (sessionStorage.getItem('pm_password_recovery') === 'true' || window.location.hash.includes('type=recovery')) navigate('/reset-password', { replace: true });
      else navigate(accountDestination(sessionStorage.getItem('pm_auth_destination')), { replace: true });
    }
  }, [user, isLoading, navigate, params]);
  return <main className="min-h-screen bg-background px-5 py-12 sm:py-20"><div className="mx-auto max-w-md"><Link to="/"><img src={logo} alt="PhoneMatrix" className="h-12 mx-auto mb-10" /></Link><div className="mb-8"><p className="text-sm text-muted-foreground mb-2">YOUR PHONEMATRIX ACCOUNT</p><h1 className="text-4xl mb-3">{initialMode === 'signup' ? 'Create your account' : initialMode === 'forgot' ? 'Let’s get you back in' : 'Welcome back'}</h1></div><AccountAccessForm key={initialMode} initialMode={initialMode} /><Link to="/" className="block text-sm text-muted-foreground mt-8">← Back to PhoneMatrix</Link></div></main>;
}
