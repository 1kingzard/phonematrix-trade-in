import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PartsRole = 'admin' | 'parts_guest' | 'none';

export const usePartsRole = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<PartsRole>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      if (!user) {
        if (!cancelled) { setRole('none'); setLoading(false); }
        return;
      }
      if (isAdmin) {
        if (!cancelled) { setRole('admin'); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const isGuest = (data || []).some((r: any) => r.role === 'parts_guest');
      if (!cancelled) {
        setRole(isGuest ? 'parts_guest' : 'none');
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isAdmin, authLoading]);

  return { role, loading: loading || authLoading, user };
};