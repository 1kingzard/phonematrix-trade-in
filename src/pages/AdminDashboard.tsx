import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, Package, Users, Gift, Plus, Edit, Trash2, UserPlus, Settings, Warehouse, ShoppingCart, DollarSign } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<ReferralCode | null>(null);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [saleEmail, setSaleEmail] = useState('');
  const [salePrice, setSalePrice] = useState<number>(0);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 0,
    discount_amount: 0,
    max_uses: '',
    expires_at: '',
    is_active: true
  });

  const [inventoryForm, setInventoryForm] = useState({
    device_brand: '',
    device_model: '',
    device_condition: '',
    quantity_available: 0,
    price: 0,
    cost_price: 0,
    sku: '',
    description: ''
  });

  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    device_brand: '',
    device_model: '',
    device_condition: '',
    total_price: 0,
    currency: 'USD',
    referral_code: ''
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

      // Fetch inventory
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (inventoryData) {
        setInventory(inventoryData);
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

  const handlePromoteAdmin = async () => {
    try {
      const { data, error } = await supabase.rpc('promote_to_admin', { 
        user_email: adminEmail 
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: `${adminEmail} has been promoted to admin`,
        });
        setAdminEmail('');
        setIsRoleModalOpen(false);
      } else {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveInventory = async () => {
    try {
      const inventoryData = {
        device_brand: inventoryForm.device_brand,
        device_model: inventoryForm.device_model,
        device_condition: inventoryForm.device_condition,
        quantity_available: inventoryForm.quantity_available,
        price: inventoryForm.price,
        cost_price: inventoryForm.cost_price || null,
        sku: inventoryForm.sku || null,
        description: inventoryForm.description || null,
        is_active: true
      };

      if (editingInventory) {
        const { error } = await supabase
          .from('inventory')
          .update(inventoryData)
          .eq('id', editingInventory.id);

        if (error) throw error;
        toast({ title: "Success", description: "Inventory item updated successfully" });
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert([inventoryData]);

        if (error) throw error;
        toast({ title: "Success", description: "Inventory item created successfully" });
      }

      setIsInventoryModalOpen(false);
      setEditingInventory(null);
      setInventoryForm({
        device_brand: '',
        device_model: '',
        device_condition: '',
        quantity_available: 0,
        price: 0,
        cost_price: 0,
        sku: '',
        description: ''
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

  const handleDeleteInventory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Inventory item deleted successfully" });
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditInventory = (item: InventoryItem) => {
    setEditingInventory(item);
    setInventoryForm({
      device_brand: item.device_brand,
      device_model: item.device_model,
      device_condition: item.device_condition,
      quantity_available: item.quantity_available,
      price: item.price,
      cost_price: item.cost_price || 0,
      sku: item.sku || '',
      description: item.description || ''
    });
    setIsInventoryModalOpen(true);
  };

  const handleCreateOrder = async () => {
    try {
      const orderData = {
        user_id: user?.id, // Admin creating order
        device_info: {
          brand: orderForm.device_brand,
          model: orderForm.device_model,
          condition: orderForm.device_condition
        },
        customer_info: {
          name: orderForm.customer_name,
          email: orderForm.customer_email,
          phone: orderForm.customer_phone
        },
        total_price: orderForm.total_price,
        currency: orderForm.currency,
        referral_code_used: orderForm.referral_code || null,
        workflow_status: 'admin_created',
        status: 'confirmed' as const
      };

      const { error } = await supabase
        .from('purchase_requests')
        .insert([orderData]);

      if (error) throw error;

      toast({ title: "Success", description: "Order created successfully" });
      setIsOrderModalOpen(false);
      setOrderForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        device_brand: '',
        device_model: '',
        device_condition: '',
        total_price: 0,
        currency: 'USD',
        referral_code: ''
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: newStatus as any })
        .eq('id', orderId);

      if (error) throw error;
      toast({ title: "Success", description: "Order status updated" });
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMarkAsSold = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setSalePrice(item.price); // Default to item price
    setSaleEmail('');
    setIsSaleModalOpen(true);
  };

  const handleProcessSale = async () => {
    if (!selectedInventoryItem || !saleEmail) {
      toast({
        title: "Error",
        description: "Please provide customer email",
        variant: "destructive",
      });
      return;
    }

    try {
      // For now, we'll use a simplified approach where we just use the email
      // as a user identifier. In a real application, you'd want to validate
      // that the user exists first.
      
      // Create a temporary user ID based on email for demonstration
      // In production, you'd want to lookup the actual user ID
      const userId = saleEmail; // This is simplified - you'd want proper user lookup

      // Call the mark_inventory_sold function
      const { data, error } = await supabase.rpc('mark_inventory_sold', {
        inventory_id: selectedInventoryItem.id,
        user_id: userId,
        sale_price: salePrice
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item marked as sold and order created successfully",
      });

      setIsSaleModalOpen(false);
      setSelectedInventoryItem(null);
      setSaleEmail('');
      setSalePrice(0);
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
                {inventory.filter(i => i.quantity_available < 5).length} low stock
              </p>
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
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="referrals">Referral Codes</TabsTrigger>
            <TabsTrigger value="admin">Admin Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Orders</CardTitle>
                    <CardDescription>Manage customer orders and assignments</CardDescription>
                  </div>
                  <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Create Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Manual Order</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="customer-name">Customer Name</Label>
                            <Input
                              id="customer-name"
                              value={orderForm.customer_name}
                              onChange={(e) => setOrderForm({...orderForm, customer_name: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="customer-email">Customer Email</Label>
                            <Input
                              id="customer-email"
                              type="email"
                              value={orderForm.customer_email}
                              onChange={(e) => setOrderForm({...orderForm, customer_email: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="customer-phone">Customer Phone</Label>
                            <Input
                              id="customer-phone"
                              value={orderForm.customer_phone}
                              onChange={(e) => setOrderForm({...orderForm, customer_phone: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="referral-code">Referral Code (Optional)</Label>
                            <Input
                              id="referral-code"
                              value={orderForm.referral_code}
                              onChange={(e) => setOrderForm({...orderForm, referral_code: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="device-brand">Device Brand</Label>
                            <Input
                              id="device-brand"
                              value={orderForm.device_brand}
                              onChange={(e) => setOrderForm({...orderForm, device_brand: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="device-model">Device Model</Label>
                            <Input
                              id="device-model"
                              value={orderForm.device_model}
                              onChange={(e) => setOrderForm({...orderForm, device_model: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="device-condition">Condition</Label>
                            <Select value={orderForm.device_condition} onValueChange={(value) => setOrderForm({...orderForm, device_condition: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="fair">Fair</SelectItem>
                                <SelectItem value="poor">Poor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="total-price">Total Price</Label>
                            <Input
                              id="total-price"
                              type="number"
                              step="0.01"
                              value={orderForm.total_price}
                              onChange={(e) => setOrderForm({...orderForm, total_price: Number(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={orderForm.currency} onValueChange={(value) => setOrderForm({...orderForm, currency: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateOrder}>Create Order</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
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
                            {order.referral_code_used && (
                              <p className="text-sm text-muted-foreground">
                                Referral: {order.referral_code_used}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <p className="font-semibold">${order.total_price} {order.currency}</p>
                            <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Inventory Management</CardTitle>
                    <CardDescription>Manage device stock and pricing</CardDescription>
                  </div>
                  <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingInventory ? 'Edit' : 'Add'} Inventory Item</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="brand">Brand</Label>
                            <Input
                              id="brand"
                              value={inventoryForm.device_brand}
                              onChange={(e) => setInventoryForm({...inventoryForm, device_brand: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="model">Model</Label>
                            <Input
                              id="model"
                              value={inventoryForm.device_model}
                              onChange={(e) => setInventoryForm({...inventoryForm, device_model: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="condition">Condition</Label>
                            <Select value={inventoryForm.device_condition} onValueChange={(value) => setInventoryForm({...inventoryForm, device_condition: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="fair">Fair</SelectItem>
                                <SelectItem value="poor">Poor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="sku">SKU</Label>
                            <Input
                              id="sku"
                              value={inventoryForm.sku}
                              onChange={(e) => setInventoryForm({...inventoryForm, sku: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                              id="quantity"
                              type="number"
                              value={inventoryForm.quantity_available}
                              onChange={(e) => setInventoryForm({...inventoryForm, quantity_available: Number(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="price">Price</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              value={inventoryForm.price}
                              onChange={(e) => setInventoryForm({...inventoryForm, price: Number(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cost-price">Cost Price</Label>
                            <Input
                              id="cost-price"
                              type="number"
                              step="0.01"
                              value={inventoryForm.cost_price}
                              onChange={(e) => setInventoryForm({...inventoryForm, cost_price: Number(e.target.value)})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={inventoryForm.description}
                            onChange={(e) => setInventoryForm({...inventoryForm, description: e.target.value})}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveInventory}>
                          {editingInventory ? 'Update' : 'Add'} Item
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {inventory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No inventory items found</p>
                ) : (
                  <div className="space-y-4">
                    {inventory.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                         <div className="flex justify-between items-start">
                           <div>
                             <h3 className="font-semibold">{item.device_brand} {item.device_model}</h3>
                             <p className="text-sm text-muted-foreground">
                               Condition: {item.device_condition} • SKU: {item.sku || 'Auto-generated'}
                             </p>
                             <p className="text-sm text-muted-foreground">
                               Quantity: {item.quantity_available} • Price: ${item.price}
                             </p>
                             <div className="flex items-center gap-2 mt-1">
                               {item.quantity_available < 5 && item.quantity_available > 0 && (
                                 <Badge variant="destructive">Low Stock</Badge>
                               )}
                               {item.sold_to_user_id && (
                                 <Badge variant="outline">Sold</Badge>
                               )}
                               {item.sold_at && (
                                 <span className="text-xs text-muted-foreground">
                                   Sold: {new Date(item.sold_at).toLocaleDateString()}
                                 </span>
                               )}
                             </div>
                           </div>
                           <div className="flex items-center space-x-2">
                             {item.quantity_available > 0 && !item.sold_to_user_id && (
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 onClick={() => handleMarkAsSold(item)}
                               >
                                 <DollarSign className="h-4 w-4 mr-1" />
                                 Mark as Sold
                               </Button>
                             )}
                             <Button variant="ghost" size="sm" onClick={() => handleEditInventory(item)}>
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="sm" onClick={() => handleDeleteInventory(item.id)}>
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

          <TabsContent value="admin" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    User Role Management
                  </CardTitle>
                  <CardDescription>Promote users to admin status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Promote to Admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Promote User to Admin</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="admin-email" className="text-right">Email</Label>
                          <Input
                            id="admin-email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className="col-span-3"
                            placeholder="user@example.com"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handlePromoteAdmin}>Promote to Admin</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    System Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Orders:</span>
                    <span className="text-sm font-medium">{orders.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Inventory Items:</span>
                    <span className="text-sm font-medium">{inventory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Codes:</span>
                    <span className="text-sm font-medium">{referralCodes.filter(c => c.is_active).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Revenue:</span>
                    <span className="text-sm font-medium">${orders.reduce((sum, order) => sum + Number(order.total_price), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Low Stock Items:</span>
                    <span className="text-sm font-medium">{inventory.filter(i => i.quantity_available < 5).length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Sale Modal */}
        <Dialog open={isSaleModalOpen} onOpenChange={setIsSaleModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Item as Sold</DialogTitle>
            </DialogHeader>
            {selectedInventoryItem && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    {selectedInventoryItem.device_brand} {selectedInventoryItem.device_model}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Condition: {selectedInventoryItem.device_condition} • SKU: {selectedInventoryItem.sku}
                  </p>
                </div>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="sale-email">Customer Email</Label>
                    <Input
                      id="sale-email"
                      type="email"
                      value={saleEmail}
                      onChange={(e) => setSaleEmail(e.target.value)}
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sale-price">Sale Price</Label>
                    <Input
                      id="sale-price"
                      type="number"
                      step="0.01"
                      value={salePrice}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaleModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessSale}>
                Mark as Sold & Create Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;