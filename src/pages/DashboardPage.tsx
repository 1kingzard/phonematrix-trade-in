import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Package, Star, User, CreditCard, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
  total_price: number;
  status: string;
  created_at: string;
  currency: string;
}

const DashboardPage = () => {
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchUserData();
    }
  }, [user, isLoading, navigate]);

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

      // Fetch purchase history
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

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account, orders, and track your loyalty rewards
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
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${loyaltyData?.total_spent || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across {loyaltyData?.total_purchases || 0} purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseHistory.length}</div>
              <p className="text-xs text-muted-foreground">
                Order history
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referral Code</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{loyaltyData?.referral_code || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">
                Share with friends
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
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
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Recent Orders
              </CardTitle>
              <CardDescription>
                Your recent purchase requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {purchaseHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <p className="text-sm text-muted-foreground">Start browsing our devices to make your first purchase!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchaseHistory.slice(0, 5).map((order) => (
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
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;