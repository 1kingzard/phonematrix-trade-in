import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import { statusTone } from '@/lib/imei';

interface OrderDetail {
  id: string;
  order_ref: string;
  identifier_masked: string;
  retail_price: number;
  status: string;
  result: Record<string, string> | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  imei_services?: { display_name: string; processing_time: string; is_instant: boolean } | null;
}

const TONE_ICON = {
  good: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
  bad: <XCircle className="h-4 w-4 text-red-500 shrink-0" />,
  warn: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
  neutral: <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0" />,
};

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-600 dark:text-green-400',
  submitted: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  processing: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
  rejected: 'bg-red-500/15 text-red-600 dark:text-red-400',
  refunded: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  reconciliation: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
};

export default function ImeiOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('imei_orders')
      .select('id, order_ref, identifier_masked, retail_price, status, result, error_message, created_at, completed_at, imei_services(display_name, processing_time, is_instant)')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) setNotFound(true);
    else setOrder(data as unknown as OrderDetail);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authLoading]);

  const refresh = async () => {
    if (!order) return;
    setRefreshing(true);
    try {
      const { data } = await supabase.functions.invoke('imei-services', {
        body: { action: 'refresh', order_id: order.id },
      });
      if (data?.status === 'completed') {
        toast({ title: 'Order completed', description: 'Your report is ready.' });
      } else {
        toast({ title: 'Still processing', description: 'This order has not completed yet. Please check back later.' });
      }
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const copyReport = () => {
    if (!order) return;
    const lines = [
      `ShopPhoneMatrix Device Report`,
      `Order: ${order.order_ref}`,
      `Service: ${order.imei_services?.display_name ?? ''}`,
      `Date: ${new Date(order.created_at).toLocaleString()}`,
      ``,
      ...Object.entries(order.result ?? {}).map(([k, v]) => `${k}: ${v}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast({ title: 'Copied', description: 'Report copied to clipboard.' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!user || notFound || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-2xl px-4 py-24 text-center space-y-4">
          <h1 className="text-2xl font-bold">Report not available</h1>
          <p className="text-muted-foreground">
            {!user ? 'Please sign in to view your reports.' : "This order doesn't exist or doesn't belong to your account."}
          </p>
          <Button asChild variant="outline"><Link to="/imei-services">Back to Phone Checks</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isPending = ['submitted', 'pending', 'processing'].includes(order.status);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/imei-services"><ArrowLeft className="h-4 w-4 mr-1" /> Phone Checks & Unlocking</Link>
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-xl">{order.imei_services?.display_name ?? 'Device Check'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {order.order_ref} · {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <Badge className={STATUS_STYLES[order.status] ?? ''} variant="secondary">
              {order.status.replace('_', ' ')}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">IMEI / Serial</p>
                <p className="font-mono">{order.identifier_masked}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount charged</p>
                <p className="tabular-nums font-medium">${order.retail_price.toFixed(2)}</p>
              </div>
              {order.completed_at && (
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p>{new Date(order.completed_at).toLocaleString()}</p>
                </div>
              )}
            </div>

            {isPending && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4">
                <p className="text-sm">
                  This order is still processing
                  {order.imei_services && !order.imei_services.is_instant
                    ? ` — estimated ${order.imei_services.processing_time}.`
                    : '.'}
                </p>
                <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Check status
                </Button>
              </div>
            )}

            {order.status === 'reconciliation' && (
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-sm">
                The supplier did not confirm this order in time. Our team is reviewing it — your wallet reservation is held
                until we confirm the outcome. No additional charge will be made.
              </div>
            )}

            {order.error_message && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">{order.error_message}</div>
            )}
          </CardContent>
        </Card>

        {order.result && Object.keys(order.result).length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Device Report</CardTitle>
              <Button size="sm" variant="outline" onClick={copyReport}>
                <Copy className="h-4 w-4 mr-1" /> Copy report
              </Button>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                {Object.entries(order.result).map(([key, value]) => {
                  const tone = statusTone(String(value));
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-sm text-muted-foreground">{key}</dt>
                      <dd className="flex items-center gap-2 text-sm font-medium text-right">
                        {TONE_ICON[tone]}
                        {String(value)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
