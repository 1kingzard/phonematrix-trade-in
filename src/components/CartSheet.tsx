import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useCatalogCurrency } from '@/components/CatalogCurrency';
import { calcBreakdown, formatJMD, formatUSD, useExchangeRate } from '@/hooks/useExchangeRate';
import { productPath } from '@/lib/catalog';

export default function CartSheet() {
  const { items, removeFromCart, clearCart, itemCount, getTotalValue } = useCart();
  const [currency] = useCatalogCurrency();
  const { rate } = useExchangeRate();
  const money = (v: number) => currency === 'JMD' ? formatJMD(v) : formatUSD(v);
  return <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="relative shrink-0" title="View cart" aria-label={`Cart, ${itemCount} items`}><ShoppingCart className="h-5 w-5" />{itemCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center px-0.5">{itemCount}</span>}</Button></SheetTrigger>
    <SheetContent className="flex flex-col w-full sm:max-w-md"><SheetHeader><SheetTitle>Your cart ({itemCount})</SheetTitle></SheetHeader>
      <div className="flex-1 overflow-auto py-6 space-y-4">{!items.length ? <div className="text-center py-16"><ShoppingCart className="h-9 w-9 mx-auto text-muted-foreground mb-4" /><p>Your cart is empty</p><p className="text-sm text-muted-foreground mt-1">Browse devices to add one.</p></div> : items.map(item => {
        const b = calcBreakdown(item.device.Price, rate);
        return <div key={item.id} className="border-b border-border pb-4 flex justify-between gap-3"><div className="min-w-0"><Link to={productPath(item.device)} className="font-medium hover:underline">{item.device.Brand} {item.device.Model}</Link><p className="text-xs text-muted-foreground mt-1">{item.device.Storage} · {item.device.Condition} · {item.device.Color || 'Default'}</p><p className="font-semibold mt-2">{money(currency === 'JMD' ? b.totalJmd : item.device.Price)}</p>{currency === 'JMD' && <p className="text-xs text-muted-foreground">Device {formatJMD(b.deviceJmd)} + estimated shipping {formatJMD(b.shippingJmd)}</p>}</div><Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} title="Remove from cart" aria-label={`Remove ${item.device.Model}`}><Trash2 className="h-4 w-4" /></Button></div>;
      })}</div>
      {items.length > 0 && <div className="border-t border-border pt-5 space-y-4"><div className="flex justify-between text-lg font-semibold"><span>{currency === 'JMD' ? 'Estimated total' : 'Device total'}</span><span>{money(getTotalValue(currency, rate))}</span></div>{currency === 'JMD' && <p className="text-xs text-muted-foreground">Includes estimated shipping to Jamaica. Final cost may vary.</p>}<p className="text-xs text-muted-foreground">Checkout is not available yet. Request a device from its product page.</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={clearCart}>Clear cart</Button><Button size="sm" asChild className="ml-auto"><Link to="/price-list">Browse devices <ArrowRight className="h-4 w-4 ml-1" /></Link></Button></div></div>}
    </SheetContent></Sheet>;
}
