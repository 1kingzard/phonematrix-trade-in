
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceData } from '../services/deviceDataService';

interface CartItem {
  device: DeviceData;
  id: string;
  addedAt: Date;
}

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
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (device: DeviceData) => {
    const newItem: CartItem = {
      device,
      id: `${device.Brand}-${device.Model}-${device.Storage}-${device.Color}-${Date.now()}`,
      addedAt: new Date()
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalValue = (currency: 'USD' | 'JMD', exchangeRate: number) => {
    return items.reduce((total, item) => {
      const price = currency === 'USD' ? item.device.Price : item.device.Price * exchangeRate;
      return total + price;
    }, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      clearCart,
      itemCount: items.length,
      getTotalValue
    }}>
      {children}
    </CartContext.Provider>
  );
};
