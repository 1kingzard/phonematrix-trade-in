import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, Package, Users, Gift, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
}

const AdminDashboard = () => {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<ReferralCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 0,
    discount_amount: 0,
    max_uses: '',
    expires_at: '',
    is_active: true
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/dashboard');
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAdminData();
    }
  }, [user, isAdmin]);

  const fetchAdminData = async () => {
    try {
      // Fetch referral codes
      const { data: codesData } = await supabase
        .from('referral_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (codesData) {
        setReferralCodes(codesData);
      }

      // Fetch all orders
      const { data: ordersData } = await supabase
        .from('purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersData) {
        setOrders(ordersData);
      }
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
  };

  const handleSaveReferralCode = async () => {
    try {
      const codeData = {
        code: formData.code,
        discount_percentage: formData.discount_percentage,
        discount_amount: formData.discount_amount,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        is_active: formData.is_active,
        created_by: user?.id
      };

      if (editingCode) {
        const { error } = await supabase
          .from('referral_codes')
          .update(codeData)
          .eq('id', editingCode.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Referral code updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('referral_codes')
          .insert([codeData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Referral code created successfully",
        });
      }

      setIsModalOpen(false);
      setEditingCode(null);
      setFormData({
        code: '',
        discount_percentage: 0,
        discount_amount: 0,
        max_uses: '',
        expires_at: '',
        is_active: true
      });
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteReferralCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('referral_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Referral code deleted successfully",
      });
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditCode = (code: ReferralCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_percentage: code.discount_percentage,
      discount_amount: code.discount_amount,
      max_uses: code.max_uses?.toString() || '',
      expires_at: code.expires_at ? new Date(code.expires_at).toISOString().split('T')[0] : '',
      is_active: code.is_active
    });
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'processed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'confirmed': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Active Referral Codes</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralCodes.filter(c => c.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${orders.reduce((sum, order) => sum + Number(order.total_price), 0).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Orders Management</TabsTrigger>
            <TabsTrigger value="referrals">Referral Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>Manage customer orders and assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No orders found</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {order.device_info?.brand} {order.device_info?.model}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Customer: {order.customer_info?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${order.total_price} {order.currency}</p>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Referral Codes Management</CardTitle>
                    <CardDescription>Create and manage referral discount codes</CardDescription>
                  </div>
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingCode ? 'Edit' : 'Create'} Referral Code</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="code" className="text-right">Code</Label>
                          <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="discount_percentage" className="text-right">Discount %</Label>
                          <Input
                            id="discount_percentage"
                            type="number"
                            value={formData.discount_percentage}
                            onChange={(e) => setFormData({...formData, discount_percentage: Number(e.target.value)})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="discount_amount" className="text-right">Discount $</Label>
                          <Input
                            id="discount_amount"
                            type="number"
                            value={formData.discount_amount}
                            onChange={(e) => setFormData({...formData, discount_amount: Number(e.target.value)})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="max_uses" className="text-right">Max Uses</Label>
                          <Input
                            id="max_uses"
                            type="number"
                            value={formData.max_uses}
                            onChange={(e) => setFormData({...formData, max_uses: e.target.value})}
                            className="col-span-3"
                            placeholder="Unlimited if empty"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="expires_at" className="text-right">Expires</Label>
                          <Input
                            id="expires_at"
                            type="date"
                            value={formData.expires_at}
                            onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="is_active" className="text-right">Active</Label>
                          <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveReferralCode}>
                          {editingCode ? 'Update' : 'Create'} Code
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {referralCodes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No referral codes created yet</p>
                ) : (
                  <div className="space-y-4">
                    {referralCodes.map((code) => (
                      <div key={code.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{code.code}</h3>
                            <p className="text-sm text-muted-foreground">
                              {code.discount_percentage > 0 && `${code.discount_percentage}% off`}
                              {code.discount_amount > 0 && `$${code.discount_amount} off`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Used: {code.used_count} / {code.max_uses || '∞'}
                            </p>
                            {code.expires_at && (
                              <p className="text-sm text-muted-foreground">
                                Expires: {new Date(code.expires_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={code.is_active ? "default" : "secondary"}>
                              {code.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => handleEditCode(code)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteReferralCode(code.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;