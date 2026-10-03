import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import TradeInQrCard from '@/components/TradeInQrCard';
import { gradeInfo, requestUrl, statusTone } from '@/lib/tradeInRequests';

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const jmd = (n: number) => 'J' + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-border/50 last:border-0 text-sm">
    <span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v}</span>
  </div>
);

const TradeInRequestPage: React.FC = () => {
  const { token = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_trade_in_request', { token });
      setData(data); setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="min-h-screen"><Header /><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></div>;
  if (!data) return (
    <div className="min-h-screen"><Header />
      <div className="container mx-auto px-4 py-20 max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Request not found</h1>
        <p className="text-muted-foreground">This link is invalid or has been removed.</p>
        <Button asChild><Link to="/trade-in">Start a trade-in</Link></Button>
      </div>
    </div>
  );

  const td = data.trade_device || {}; const dd = data.desired_device; const est = data.estimate || {};
  const grade = gradeInfo(data.condition);
  const faults: string[] = Array.isArray(data.faults) ? data.faults : [];
  const adjusted = data.final_value_usd != null && Number(data.final_value_usd) !== Number(data.estimated_value_usd);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-2xl space-y-4">
        <Card className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Trade-In Request</p>
              <h1 className="text-2xl font-bold tabular-nums">{data.request_code}</h1>
              <p className="text-xs text-muted-foreground">Created {new Date(data.created_at).toLocaleString()}</p>
            </div>
            <Badge variant={statusTone(data.status)} className="text-sm">{data.status}</Badge>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mb-4">
            <p className="text-xs text-muted-foreground">{adjusted ? 'Original Estimated Trade Value' : 'Estimated Trade Value'}</p>
            <p className={`text-3xl font-bold ${adjusted ? 'line-through text-muted-foreground text-xl' : ''}`}>{usd(data.estimated_value_usd)}</p>
            {adjusted && (<>
              <p className="text-xs text-muted-foreground mt-2">Final Approved Trade Value</p>
              <p className="text-3xl font-bold">{usd(data.final_value_usd)}</p>
            </>)}
            {data.expires_at && <p className="text-xs text-muted-foreground mt-2">Quote valid until {new Date(data.expires_at).toLocaleDateString()}</p>}
          </div>

          <h2 className="font-semibold mb-1">Your device</h2>
          <Row k="Device" v={`${td.brand ?? ''} ${td.model ?? ''}`} />
          <Row k="Storage" v={td.storage || '—'} />
          {td.color && <Row k="Color" v={td.color} />}
          {td.unlocked && <Row k="Network" v={td.unlocked === 'unlocked' ? 'Unlocked' : 'Carrier locked'} />}
          <Row k="Grade" v={data.condition || '—'} />
          {grade && <p className="text-xs text-muted-foreground py-1">{grade.long}</p>}
          {data.battery_pct != null && <Row k="Battery health" v={`${data.battery_pct}%`} />}
          <Row k="Faults" v={faults.length ? faults.join(', ') : 'None reported'} />

          {dd && (<>
            <h2 className="font-semibold mt-5 mb-1">Device you want</h2>
            <Row k="Device" v={`${dd.brand} ${dd.model}`} />
            <Row k="Details" v={`${dd.storage} • ${dd.condition} • ${dd.color}`} />
            {est.usaTotalUSD != null && <Row k="Price for USA customers" v={usd(est.usaTotalUSD)} />}
            {est.jamaicaTotalJMD != null && <Row k="Price for Jamaica customers" v={jmd(est.jamaicaTotalJMD)} />}
          </>)}

          <h2 className="font-semibold mt-5 mb-1">Customer</h2>
          <Row k="Name" v={data.customer_name} />
          <Row k="Phone" v={data.customer_phone_masked} />
        </Card>

        <Card className="p-5"><TradeInQrCard url={requestUrl(token)} code={data.request_code} showView={false} /></Card>
      </div>
    </div>
  );
};

export default TradeInRequestPage;
