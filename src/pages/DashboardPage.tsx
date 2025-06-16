import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Package, Star, User, CreditCard, Award, Shield, Plus, Edit, Trash2, UserPlus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
}

interface LoyaltyData {
  points: number;
  tier: string;
  total_spent: number;
  total_purchases: number;
  referral_code: string | null;
}

interface PurchaseRequest {
  id: string;
  device_info: any;
  customer_info: any;
  total_price: number;
  status: string;
  created_at: string;
  currency: string;
  user_id: string;
}

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

const DashboardPage = () => {
  const { user, isLoading, isAdmin } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRequest[]>([]);
  const [allOrders, setAllOrders] = useState<PurchaseRequest[]>([]);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<ReferralCode | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 0,
    discount_amount: 0,
    max_uses: '',
    expires_at: '',
    is_active: true
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }

    // Redirect admins to admin dashboard
    if (user && isAdmin) {
      navigate('/admin');
      return;
    }

    if (user) {
      fetchUserData();
    }
  }, [user, isLoading, isAdmin, navigate]);

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch loyalty data
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('customer_loyalty')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (loyaltyError && loyaltyError.code !== 'PGRST116') {
        console.error('Loyalty error:', loyaltyError);
      } else {
        setLoyaltyData(loyaltyData);
      }

      // Fetch user's purchase history
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (purchaseError) {
        console.error('Purchase history error:', purchaseError);
      } else {
        setPurchaseHistory(purchaseData || []);
      }

      // If admin, fetch all data
      if (isAdmin) {
        // Fetch all orders
        const { data: allOrdersData } = await supabase
          .from('purchase_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (allOrdersData) {
          setAllOrders(allOrdersData);
        }

        // Fetch referral codes
        const { data: codesData } = await supabase
          .from('referral_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (codesData) {
          setReferralCodes(codesData);
        }
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

      setIsCodeModalOpen(false);
      setEditingCode(null);
      setFormData({
        code: '',
        discount_percentage: 0,
        discount_amount: 0,
        max_uses: '',
        expires_at: '',
        is_active: true
      });
      fetchUserData();
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
      fetchUserData();
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
    setIsCodeModalOpen(true);
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200';
      case 'confirmed': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            {isAdmin && <Shield className="mr-3 h-8 w-8 text-purple-600" />}
            Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin ? 'Admin Dashboard - Manage orders, referral codes, and user roles' : 'Manage your account, orders, and track your loyalty rewards'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loyaltyData?.points || 0}</div>
              <p className="text-xs text-muted-foreground">
                {loyaltyData?.tier && (
                  <Badge variant="outline" className={getTierColor(loyaltyData.tier)}>
                    {loyaltyData.tier.charAt(0).toUpperCase() + loyaltyData.tier.slice(1)} Tier
                  </Badge>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isAdmin ? 'Total Revenue' : 'Total Spent'}
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${isAdmin ? allOrders.reduce((sum, order) => sum + Number(order.total_price), 0).toFixed(2) : (loyaltyData?.total_spent || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? `From ${allOrders.length} orders` : `Across ${loyaltyData?.total_purchases || 0} purchases`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isAdmin ? 'All Orders' : 'My Orders'}
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isAdmin ? allOrders.length : purchaseHistory.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Order history
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isAdmin ? 'Active Codes' : 'Referral Code'}
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {isAdmin ? referralCodes.filter(c => c.is_active).length : (loyaltyData?.referral_code || 'N/A')}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Referral codes' : 'Share with friends'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={isAdmin ? "admin" : "account"} className="space-y-4">
          <TabsList>
            {isAdmin && <TabsTrigger value="admin">Admin Panel</TabsTrigger>}
            <TabsTrigger value="account">My Account</TabsTrigger>
            <TabsTrigger value="orders">{isAdmin ? 'All Orders' : 'My Orders'}</TabsTrigger>
            {isAdmin && <TabsTrigger value="referrals">Referral Codes</TabsTrigger>}
          </TabsList>

          {isAdmin && (
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
                      <span className="text-sm font-medium">{allOrders.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Codes:</span>
                      <span className="text-sm font-medium">{referralCodes.filter(c => c.is_active).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Revenue:</span>
                      <span className="text-sm font-medium">${allOrders.reduce((sum, order) => sum + Number(order.total_price), 0).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{user?.email}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : 'Not set'
                    }
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{profile?.phone || 'Not set'}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">{profile?.address || 'Not set'}</p>
                </div>
                {isAdmin && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Role</p>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                        Administrator
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  {isAdmin ? 'All Orders' : 'My Orders'}
                </CardTitle>
                <CardDescription>
                  {isAdmin ? 'Manage all customer orders' : 'Your recent purchase requests and their status'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(isAdmin ? allOrders : purchaseHistory).length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <p className="text-sm text-muted-foreground">
                      {isAdmin ? 'No customer orders found' : 'Start browsing our devices to make your first purchase!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(isAdmin ? allOrders : purchaseHistory).slice(0, 10).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">
                              {order.device_info?.brand} {order.device_info?.model}
                            </h4>
                            <Badge variant="outline" className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          {isAdmin && order.customer_info && (
                            <p className="text-sm text-muted-foreground">
                              Customer: {order.customer_info?.name || 'N/A'}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <span>${order.total_price} {order.currency}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="referrals" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Referral Codes Management</CardTitle>
                      <CardDescription>Create and manage referral discount codes</CardDescription>
                    </div>
                    <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-background border">
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
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;