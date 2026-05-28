import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useExchangeRateSetting = () => {
  const [rate, setRate] = useState<number>(157);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.from('parts_settings').select('exchange_rate').limit(1).maybeSingle();
      if (!cancelled && data?.exchange_rate) setRate(Number(data.exchange_rate));
      if (!cancelled) setLoading(false);
    };
    load();
    const channel = supabase
      .channel('parts-settings-rate')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts_settings' }, (payload: any) => {
        const r = payload.new?.exchange_rate;
        if (r) setRate(Number(r));
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  return { rate, loading };
};