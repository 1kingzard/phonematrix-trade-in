
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeviceData } from '../services/deviceDataService';

interface PurchaseRequest {
  id: string;
  device: DeviceData;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes?: string;
  };
  totalPrice: number;
  currency: 'USD' | 'JMD';
  requestDate: Date;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
}

interface PurchaseHistoryContextType {
  requests: PurchaseRequest[];
  addPurchaseRequest: (request: Omit<PurchaseRequest, 'id' | 'requestDate' | 'status'>) => void;
  getTotalPurchases: () => number;
  getTotalSpent: () => number;
  getDiscountRate: () => number;
}

const PurchaseHistoryContext = createContext<PurchaseHistoryContextType | undefined>(undefined);

export const usePurchaseHistory = () => {
  const context = useContext(PurchaseHistoryContext);
  if (context === undefined) {
    throw new Error('usePurchaseHistory must be used within a PurchaseHistoryProvider');
  }
  return context;
};

export const PurchaseHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);

  useEffect(() => {
    // Load purchase history from localStorage
    const savedHistory = localStorage.getItem('purchaseHistory');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setRequests(parsed.map((req: any) => ({
        ...req,
        requestDate: new Date(req.requestDate)
      })));
    }
  }, []);

  useEffect(() => {
    // Save purchase history to localStorage
    localStorage.setItem('purchaseHistory', JSON.stringify(requests));
  }, [requests]);

  const addPurchaseRequest = (request: Omit<PurchaseRequest, 'id' | 'requestDate' | 'status'>) => {
    const newRequest: PurchaseRequest = {
      ...request,
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestDate: new Date(),
      status: 'pending'
    };
    setRequests(prev => [newRequest, ...prev]);
  };

  const getTotalPurchases = () => {
    return requests.filter(req => req.status === 'completed').length;
  };

  const getTotalSpent = () => {
    return requests
      .filter(req => req.status === 'completed')
      .reduce((total, req) => total + req.totalPrice, 0);
  };

  const getDiscountRate = () => {
    const totalPurchases = getTotalPurchases();
    if (totalPurchases >= 10) return 0.15; // 15% discount for 10+ purchases
    if (totalPurchases >= 5) return 0.10;  // 10% discount for 5+ purchases
    if (totalPurchases >= 3) return 0.05;  // 5% discount for 3+ purchases
    return 0; // No discount for less than 3 purchases
  };

  return (
    <PurchaseHistoryContext.Provider value={{
      requests,
      addPurchaseRequest,
      getTotalPurchases,
      getTotalSpent,
      getDiscountRate
    }}>
      {children}
    </PurchaseHistoryContext.Provider>
  );
};
