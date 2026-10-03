import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceData } from '@/services/deviceDataService';
import { calcTotalJMD } from '@/hooks/useExchangeRate';

interface CartItem { device: DeviceData; id: string; addedAt: string; }
interface CartContextType {
  items: CartItem[];
  addToCart: (device: DeviceData) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  getTotalValue: (currency: 'USD' | 'JMD', exchangeRate: number) => number;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cart') || '[]');
      return Array.isArray(saved) ? saved.filter((item): item is CartItem => item && typeof item.id === 'string' && Number.isFinite(item.device?.Price)) : [];
    } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('cart', JSON.stringify(items)); } catch { /* storage unavailable */ } }, [items]);
  const addToCart = (device: DeviceData) => setItems(prev => [...prev, { device, id: crypto.randomUUID(), addedAt: new Date().toISOString() }]);
  const removeFromCart = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
  const clearCart = () => setItems([]);
  const getTotalValue = (currency: 'USD' | 'JMD', rate: number) => items.reduce((total, item) => total + (currency === 'USD' ? item.device.Price : calcTotalJMD(item.device.Price, rate)), 0);
  return <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, itemCount: items.length, getTotalValue }}>{children}</CartContext.Provider>;
};
