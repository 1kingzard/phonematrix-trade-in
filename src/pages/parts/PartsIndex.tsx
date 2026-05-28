import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartsRole } from '@/hooks/usePartsRole';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const PartsIndex = () => {
  const navigate = useNavigate();
  const { role, loading, user } = usePartsRole();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login?redirect=/parts', { replace: true }); return; }
    if (role === 'admin') navigate('/parts/admin', { replace: true });
    else if (role === 'parts_guest') navigate('/parts/guest', { replace: true });
    else navigate('/', { replace: true });
  }, [role, loading, user, navigate]);

  return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
};

export default PartsIndex;