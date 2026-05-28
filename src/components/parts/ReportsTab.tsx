import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fmtJMD, fmtUSD, InventoryRow, costPerUnitJmd, inventoryValueJmd, projectedProfitJmd, totalCostUsd } from '@/lib/partsCalc';
import { useExchangeRateSetting } from '@/hooks/useExchangeRateSetting';

const ReportsTab = () => {
  const [inv, setInv] = useState<InventoryRow[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [cols, setCols] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
  const { rate } = useExchangeRateSetting();

  useEffect(() => {
    (async () => {
      const [i, s, c, d] = await Promise.all([
        supabase.from('parts_inventory').select('*'),
        supabase.from('parts_sales').select('*'),
        supabase.from('parts_collections').select('*'),
        supabase.from('parts_deposits').select('*'),
      ]);
      setInv((i.data || []) as any); setSales(s.data || []); setCols(c.data || []); setDeps(d.data || []);
    })();
  }, []);

  const itemMap: Record<string, InventoryRow> = {};
  inv.forEach(i => itemMap[i.id] = i);

  const revenue = sales.reduce((a, s) => a + Number(s.total_jmd), 0);
  const cogs = sales.reduce((a, s) => a + (itemMap[s.inventory_id] ? costPerUnitJmd(itemMap[s.inventory_id], rate) * s.units_sold : 0), 0);
  const profit = revenue - cogs;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const collected = cols.reduce((a, c) => a + Number(c.amount_jmd), 0);
  const outstanding = sales.reduce((a, s) => a + Number(s.total_jmd), 0) - collected;
  const verifiedDeposits = deps.filter(d => d.status === 'verified').reduce((a, d) => a + Number(d.amount_jmd), 0);

  const activeInv = inv.filter(i => !i.archived);
  const purchaseUsd = activeInv.reduce((a, i) => a + totalCostUsd(i), 0);
  const projRevenue = activeInv.reduce((a, i) => a + i.selling_price_jmd * i.qty_available, 0);
  const invValue = activeInv.reduce((a, i) => a + inventoryValueJmd(i, rate), 0);
  const projProfit = activeInv.reduce((a, i) => a + projectedProfitJmd(i, rate), 0);

  const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
      <CardContent><div className="text-xl font-bold">{value}</div>{sub && <div className="text-xs text-muted-foreground">{sub}</div>}</CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Profit & Loss</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Revenue" value={fmtJMD(revenue)} />
          <Stat label="COGS" value={fmtJMD(cogs)} />
          <Stat label="Profit" value={fmtJMD(profit)} />
          <Stat label="Margin" value={`${margin.toFixed(1)}%`} />
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Cash Flow (JMD)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat label="Collected" value={fmtJMD(collected)} />
          <Stat label="Outstanding" value={fmtJMD(outstanding)} />
          <Stat label="Verified Deposits" value={fmtJMD(verifiedDeposits)} />
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Inventory Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Purchase Cost" value={fmtUSD(purchaseUsd)} sub={fmtJMD(purchaseUsd * rate)} />
          <Stat label="Inventory Value" value={fmtJMD(invValue)} />
          <Stat label="Projected Revenue" value={fmtJMD(projRevenue)} />
          <Stat label="Projected Profit" value={fmtJMD(projProfit)} />
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;