
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useExchangeRate } from '../services/deviceDataService';

interface CartSheetProps {
  currency: 'USD' | 'JMD';
}

const CartSheet: React.FC<CartSheetProps> = ({ currency }) => {
  const { items, removeFromCart, clearCart, itemCount, getTotalValue } = useCart();
  const { exchangeRate } = useExchangeRate();

  const formatPrice = (price: number) => {
    const priceInCurrency = currency === 'USD' ? price : price * exchangeRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceInCurrency);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart ({itemCount} items)</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Your cart is empty</p>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.device.Brand} {item.device.Model}</h3>
                      <p className="text-sm text-gray-600">
                        {item.device.Storage} • {item.device.Color} • {item.device.Condition}
                      </p>
                      <p className="font-bold text-[#d81570]">{formatPrice(item.device.Price)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg">Total: {formatPrice(getTotalValue(currency, exchangeRate))}</span>
                </div>
                
                <div className="space-y-2">
                  <Button className="w-full bg-[#d81570] hover:bg-[#e83a8e]">
                    Proceed to Checkout
                  </Button>
                  <Button variant="outline" className="w-full" onClick={clearCart}>
                    Clear Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
