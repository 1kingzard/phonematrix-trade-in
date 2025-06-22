import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Package, Users, Gift, Warehouse } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import InventoryManagement from '@/components/admin/InventoryManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import ReferralCodeManagement from '@/components/admin/ReferralCodeManagement';
import AdminTools from '@/components/admin/AdminTools';

interface ReferralCode {
  id: string;
  code: string;
  discount_percentage: number;
  discount_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface PurchaseRequest {
  id: string;
  device_info: any;
  customer_info: any;
  total_price: number;
  status: string;
  created_at: string;
  currency: string;
  assigned_to: string | null;
  workflow_status: string;
  referral_code_used: string | null;
}

interface InventoryItem {
  id: string;
  device_brand: string;
  device_model: string;
  device_condition: string;
  quantity_available: number;
  price: number;
  cost_price: number | null;
  sku: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  sold_to_user_id: string | null;
  sold_at: string | null;
  order_id: string | null;
}

const AdminDashboard = () => {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/dashboard');
    }
  }, [user, authLoading, isAdmin, navigate]);

  const fetchAdminData = useCallback(async () => {
    try {
      const [codesResponse, ordersResponse, inventoryResponse] = await Promise.all([
        supabase.from('referral_codes').select('*').order('created_at', { ascending: false }),
        supabase.from('purchase_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('inventory').select('*').order('created_at', { ascending: false })
      ]);

      if (codesResponse.data) setReferralCodes(codesResponse.data);
      if (ordersResponse.data) setOrders(ordersResponse.data);
      if (inventoryResponse.data) setInventory(inventoryResponse.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAdminData();
    }
  }, [user, isAdmin, fetchAdminData]);

  const totalRevenue = React.useMemo(() => 
    orders.reduce((sum, order) => sum + Number(order.total_price), 0).toFixed(2)
  , [orders]);

  const lowStockCount = React.useMemo(() => 
    inventory.filter(i => i.quantity_available < 5).length
  , [inventory]);

  const activeCodes = React.useMemo(() => 
    referralCodes.filter(c => c.is_active).length
  , [referralCodes]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Shield className="mr-3 h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage orders, referral codes, and system settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">
                {lowStockCount} low stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Referral Codes</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCodes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Orders Management</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="referrals">Referral Codes</TabsTrigger>
            <TabsTrigger value="admin">Admin Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <OrderManagement orders={orders} onRefresh={fetchAdminData} user={user} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <InventoryManagement inventory={inventory} onRefresh={fetchAdminData} user={user} />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <ReferralCodeManagement referralCodes={referralCodes} onRefresh={fetchAdminData} user={user} />
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <AdminTools orders={orders} inventory={inventory} referralCodes={referralCodes} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
