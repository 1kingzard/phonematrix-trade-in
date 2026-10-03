import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { usd, fmtDate, fmtDateTime, installmentOwed, isLate, warrantyEnd, SHIPMENT_STATUSES } from '@/lib/stock';
import { statusTone } from '@/lib/tradeInRequests';

const CustomerPortal = () => {
  const { token } = useParams();
  const [data, setData] = useState<any>(undefined);

  useEffect(() => {
    (supabase as any).rpc('get_customer_portal', { token }).then(({ data }: any) => setData(data || null));
  }, [token]);

  useEffect(() => { document.title = 'My Phone Matrix'; }, []);

  if (data === undefined) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        {!data ? <p className="text-center text-muted-foreground">This link isn't valid. Please contact Phone Matrix.</p> : <>
          <div><h1 className="text-3xl font-bold">Hi {data.name}</h1><p className="text-muted-foreground">{data.phone_masked}</p></div>

          {data.purchases.length === 0 && <p className="text-muted-foreground">No purchases yet.</p>}
          {data.purchases.map((p: any) => {
            const wEnd = warrantyEnd(p.sold_at, p.warranty_days);
            const daysLeft = Math.ceil((wEnd.getTime() - Date.now()) / 86400000);
            const owed = p.installments.reduce((a: number, i: any) => a + installmentOwed(i), 0);
            const paid = Number(p.deposit) + p.installments.reduce((a: number, i: any) => a + Number(i.paid_amount), 0);
            const lastStatus = p.shipments[p.shipments.length - 1]?.status;
            const stepIdx = SHIPMENT_STATUSES.indexOf(lastStatus);
            return (
              <Card key={p.id}>
                <CardHeader className="flex flex-row gap-4 items-center space-y-0">
                  {p.photo && <img src={p.photo} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                  <div><CardTitle>{p.brand} {p.model}</CardTitle><p className="text-sm text-muted-foreground">{[p.storage, p.colour, p.condition].filter(Boolean).join(' · ')}</p></div>
                </CardHeader>
                <CardContent className="space-y-5 text-sm">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div><div className="text-muted-foreground">Purchase price</div><div className="font-semibold">{usd(p.sold_for)}</div>
                      {p.loyalty_discount > 0 && <div className="text-xs text-muted-foreground">Includes loyalty discount −{usd(p.loyalty_discount)}</div>}
                      {p.trade_credit > 0 && <div className="text-xs text-muted-foreground">Trade-in credit {usd(p.trade_credit)}</div>}</div>
                    <div><div className="text-muted-foreground">Purchase date</div><div className="font-semibold">{fmtDateTime(p.sold_at)}</div></div>
                    <div><div className="text-muted-foreground">Warranty</div><div className="font-semibold">Until {fmtDate(wEnd.toISOString())}</div>
                      <Badge variant={daysLeft > 0 ? 'secondary' : 'outline'}>{daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}</Badge></div>
                  </div>

                  {(p.tracking_number || p.shipments.length > 0) && <section>
                    <h3 className="font-semibold mb-2">Shipping {p.tracking_number && <span className="font-normal text-muted-foreground">· {p.courier} {p.tracking_number}</span>}</h3>
                    <div className="flex gap-1 mb-3">{SHIPMENT_STATUSES.map((s, k) => <div key={s} title={s} className={`h-1.5 flex-1 rounded-full ${k <= stepIdx ? 'bg-primary' : 'bg-muted'}`} />)}</div>
                    <ol className="border-l-2 border-border ml-1 space-y-2">
                      {[...p.shipments].reverse().map((e: any, k: number) => (
                        <li key={k} className="pl-3"><div className="font-medium">{e.status}</div><div className="text-xs text-muted-foreground">{fmtDateTime(e.occurred_at)}{e.note ? ` — ${e.note}` : ''}</div></li>
                      ))}
                    </ol>
                  </section>}

                  {p.is_payment_plan && <section>
                    <h3 className="font-semibold mb-2">Payment plan</h3>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div><div className="text-muted-foreground">Agreed</div><div className="font-semibold">{usd(p.plan_total)}</div></div>
                      <div><div className="text-muted-foreground">Paid</div><div className="font-semibold">{usd(paid)}</div></div>
                      <div><div className="text-muted-foreground">Remaining</div><div className="font-semibold">{usd(owed)}</div></div>
                    </div>
                    <div className="border rounded-md divide-y">
                      {p.installments.map((i: any, k: number) => (
                        <div key={k} className="flex items-center justify-between p-2">
                          <span>{fmtDate(i.due_date)}</span>
                          <span className="tabular-nums">{usd(Number(i.amount) + Number(i.late_fee))}{i.late_fee > 0 && <span className="text-xs text-muted-foreground"> (late fee {usd(i.late_fee)})</span>}</span>
                          {installmentOwed(i) === 0 ? <Badge variant="secondary">Paid</Badge> : isLate(i) ? <Badge variant="destructive">Overdue</Badge> : <Badge variant="outline">Upcoming</Badge>}
                        </div>
                      ))}
                    </div>
                  </section>}
                </CardContent>
              </Card>
            );
          })}

          {data.trade_ins.length > 0 && <Card>
            <CardHeader><CardTitle>Trade-in requests & quotes</CardTitle></CardHeader>
            <CardContent className="divide-y text-sm">
              {data.trade_ins.map((t: any) => (
                <Link key={t.request_code} to={`/trade-in/request/${t.public_token}`} className="flex items-center justify-between py-2 hover:opacity-80">
                  <div><div className="font-medium">{t.request_code} · {t.trade_device?.model || t.trade_device?.name || 'Device'}</div><div className="text-xs text-muted-foreground">{fmtDateTime(t.created_at)}</div></div>
                  <div className="text-right"><div className="tabular-nums">{usd(t.final_value_usd ?? t.estimated_value_usd)}</div><Badge variant={statusTone(t.status)}>{t.status}</Badge></div>
                </Link>
              ))}
            </CardContent>
          </Card>}
        </>}
      </main>
    </div>
  );
};

export default CustomerPortal;
