import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Settings,
  Gift,
  Crown,
  Star,
  Award,
  Edit,
  Save,
  X
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface Customer {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  points: number;
  tier: string;
  total_spent: number;
  total_purchases: number;
}

interface PurchaseRequest {
  id: string;
  user_id: string;
  device_info: any;
  customer_info: any;
  total_price: number;
  currency: string;
  status: string;
  created_at: string;
  tracking_number?: string;
  admin_notes?: string;
}

interface DiscountCode {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at?: string;
}

const AdminDashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [newDiscountCode, setNewDiscountCode] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    max_uses: 100,
    expires_at: ''
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      // Use the is_admin function instead of querying admin_roles directly
      const { data, error } = await supabase.rpc('is_admin');

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
        if (data) {
          fetchAdminData();
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const [
        { count: totalUsers },
        { count: totalOrders },
        { count: pendingOrders },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('purchase_requests').select('*', { count: 'exact', head: true }),
        supabase.from('purchase_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('purchase_requests').select('total_price').eq('status', 'completed')
      ]);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_price, 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        pendingOrders: pendingOrders || 0
      });

      // Fetch customers with loyalty data
      const { data: customersData, error: customersError } = await supabase
        .from('profiles')
        .select(`
          *,
          customer_loyalty (*)
        `)
        .order('created_at', { ascending: false });

      if (customersError) {
        console.error('Error fetching customers:', customersError);
      } else {
        const formattedCustomers = customersData?.map(customer => {
          const loyalty = Array.isArray(customer.customer_loyalty) ? customer.customer_loyalty[0] : null;
          return {
            id: customer.id,
            user_id: customer.user_id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: 'N/A', // We'll fetch emails separately if needed
            points: loyalty?.points || 0,
            tier: loyalty?.tier || 'bronze',
            total_spent: loyalty?.total_spent || 0,
            total_purchases: loyalty?.total_purchases || 0
          };
        }) || [];
        setCustomers(formattedCustomers);
      }

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        setOrders(ordersData || []);
      }

      // Fetch discount codes
      const { data: discountsData, error: discountsError } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (discountsError) {
        console.error('Error fetching discount codes:', discountsError);
      } else {
        setDiscountCodes(discountsData || []);
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin dashboard data',
        variant: 'destructive',
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, tracking?: string, notes?: string) => {
    try {
      const updates: any = { status };
      if (tracking) updates.tracking_number = tracking;
      if (notes) updates.admin_notes = notes;

      const { error } = await supabase
        .from('purchase_requests')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order updated successfully',
      });

      fetchAdminData();
      setEditingOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive',
      });
    }
  };

  const createDiscountCode = async () => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .insert([{
          ...newDiscountCode,
          expires_at: newDiscountCode.expires_at || null
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Discount code created successfully',
      });

      setNewDiscountCode({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        max_uses: 100,
        expires_at: ''
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error creating discount code:', error);
      toast({
        title: 'Error',
        description: 'Failed to create discount code',
        variant: 'destructive',
      });
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award className="h-4 w-4" />;
      case 'silver': return <Star className="h-4 w-4" />;
      case 'gold': return <Crown className="h-4 w-4" />;
      case 'platinum': return <Crown className="h-4 w-4 text-purple-600" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processed': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have admin privileges to access this dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your PhoneMatrix business operations
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">Orders Management</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="discounts">Discount Codes</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>
                  View and manage all customer purchase requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">
                            {order.device_info?.brand} {order.device_info?.model}
                          </h4>
                          <p className="text-sm text-gray-600">
                            ${order.total_price} {order.currency} • 
                            Order ID: {order.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingOrder(editingOrder === order.id ? null : order.id)}
                          >
                            {editingOrder === order.id ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {editingOrder === order.id && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Status</Label>
                              <Select defaultValue={order.status}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="processed">Processed</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Tracking Number</Label>
                              <Input 
                                placeholder="Enter tracking number"
                                defaultValue={order.tracking_number || ''}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Admin Notes</Label>
                            <Textarea 
                              placeholder="Add notes about this order..."
                              defaultValue={order.admin_notes || ''}
                            />
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              const status = (document.querySelector(`select`) as HTMLSelectElement)?.value || order.status;
                              const tracking = (document.querySelector(`input[placeholder="Enter tracking number"]`) as HTMLInputElement)?.value;
                              const notes = (document.querySelector(`textarea`) as HTMLTextAreaElement)?.value;
                              updateOrderStatus(order.id, status, tracking, notes);
                            }}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>
                  View customer loyalty status and purchase history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">
                            {customer.first_name} {customer.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              {getTierIcon(customer.tier)}
                              <span className="capitalize">{customer.tier} Tier</span>
                            </div>
                            <span>{customer.points} points</span>
                            <span>${customer.total_spent.toFixed(2)} spent</span>
                            <span>{customer.total_purchases} orders</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discounts">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Discount Code</CardTitle>
                  <CardDescription>
                    Add new discount codes for customer promotions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Code</Label>
                      <Input
                        placeholder="SAVE20"
                        value={newDiscountCode.code}
                        onChange={(e) => setNewDiscountCode({...newDiscountCode, code: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={newDiscountCode.discount_type}
                        onValueChange={(value) => setNewDiscountCode({...newDiscountCode, discount_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Value</Label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={newDiscountCode.discount_value}
                        onChange={(e) => setNewDiscountCode({...newDiscountCode, discount_value: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label>Max Uses</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={newDiscountCode.max_uses}
                        onChange={(e) => setNewDiscountCode({...newDiscountCode, max_uses: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      placeholder="20% off all devices"
                      value={newDiscountCode.description}
                      onChange={(e) => setNewDiscountCode({...newDiscountCode, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Expires At (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={newDiscountCode.expires_at}
                      onChange={(e) => setNewDiscountCode({...newDiscountCode, expires_at: e.target.value})}
                    />
                  </div>
                  <Button onClick={createDiscountCode}>
                    <Gift className="h-4 w-4 mr-2" />
                    Create Discount Code
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Discount Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {discountCodes.map((code) => (
                      <div key={code.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold font-mono">{code.code}</h4>
                            <p className="text-sm text-gray-600">{code.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>
                                {code.discount_type === 'percentage' ? `${code.discount_value}%` : `$${code.discount_value}`} off
                              </span>
                              <span>{code.used_count}/{code.max_uses} used</span>
                              {code.expires_at && (
                                <span>Expires: {new Date(code.expires_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant={code.is_active ? "default" : "secondary"}>
                            {code.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>
                  Configure system settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">System Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Admin User: {user.email}</p>
                      <p>Dashboard Version: 1.0.0</p>
                      <p>Database: Connected</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;