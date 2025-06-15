import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Crown, Gift, Star, TrendingUp, Clock, DollarSign, Package, Award } from 'lucide-react';

interface LoyaltyData {
  points: number;
  tier: string;
  total_spent: number;
  total_purchases: number;
  referral_code: string;
}

interface PurchaseRequest {
  id: string;
  device_info: any;
  total_price: number;
  currency: string;
  status: string;
  created_at: string;
  tracking_number?: string;
  estimated_delivery?: string;
}

interface PointsTransaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

const UserDashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch loyalty data
      const { data: loyalty, error: loyaltyError } = await supabase
        .from('customer_loyalty')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (loyaltyError && loyaltyError.code !== 'PGRST116') {
        console.error('Error fetching loyalty data:', loyaltyError);
      } else {
        setLoyaltyData(loyalty);
      }

      // Fetch purchase requests
      const { data: requests, error: requestsError } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching purchase requests:', requestsError);
      } else {
        setPurchaseRequests(requests || []);
      }

      // Fetch points transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('Error fetching points transactions:', transactionsError);
      } else {
        setPointsTransactions(transactions || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return { name: 'Bronze', color: 'bg-amber-100 text-amber-800', discount: '5%', icon: Award };
      case 'silver':
        return { name: 'Silver', color: 'bg-gray-100 text-gray-800', discount: '10%', icon: Star };
      case 'gold':
        return { name: 'Gold', color: 'bg-yellow-100 text-yellow-800', discount: '15%', icon: Crown };
      case 'platinum':
        return { name: 'Platinum', color: 'bg-purple-100 text-purple-800', discount: '20%', icon: Crown };
      default:
        return { name: 'Bronze', color: 'bg-amber-100 text-amber-800', discount: '5%', icon: Award };
    }
  };

  const getNextTierInfo = (currentPoints: number) => {
    if (currentPoints < 1000) return { tier: 'Silver', needed: 1000 - currentPoints };
    if (currentPoints < 2500) return { tier: 'Gold', needed: 2500 - currentPoints };
    if (currentPoints < 5000) return { tier: 'Platinum', needed: 5000 - currentPoints };
    return null;
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
          <div className="text-lg">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tierInfo = getTierInfo(loyaltyData?.tier || 'bronze');
  const nextTier = getNextTierInfo(loyaltyData?.points || 0);
  const progressPercentage = loyaltyData?.points ? 
    (loyaltyData.points >= 5000 ? 100 : 
     loyaltyData.points >= 2500 ? ((loyaltyData.points - 2500) / 2500) * 100 + 75 :
     loyaltyData.points >= 1000 ? ((loyaltyData.points - 1000) / 1500) * 100 + 50 :
     (loyaltyData.points / 1000) * 50) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's your PhoneMatrix dashboard overview
          </p>
        </div>

        {/* Loyalty Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
              <tierInfo.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge className={tierInfo.color}>
                {tierInfo.name}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {tierInfo.discount} discount on all purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loyaltyData?.points || 0}</div>
              <p className="text-xs text-muted-foreground">
                Available for redemption
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${loyaltyData?.total_spent?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {loyaltyData?.total_purchases || 0} purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referral Code</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-mono font-bold">
                {loyaltyData?.referral_code || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Share for bonus points
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Progress to {nextTier.tier}</CardTitle>
              <CardDescription>
                You need {nextTier.needed} more points to reach {nextTier.tier} tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercentage} className="w-full" />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{loyaltyData?.points || 0} points</span>
                <span>{nextTier.needed} points to go</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="points">Points History</TabsTrigger>
            <TabsTrigger value="benefits">Tier Benefits</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>
                  Track your device purchase requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchaseRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No purchase requests yet</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate('/trade-in')}
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchaseRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">
                              {request.device_info?.brand} {request.device_info?.model}
                            </h4>
                            <p className="text-sm text-gray-600">
                              ${request.total_price} {request.currency}
                            </p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Ordered on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                        {request.tracking_number && (
                          <p className="text-sm text-blue-600 mt-1">
                            Tracking: {request.tracking_number}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle>Points Activity</CardTitle>
                <CardDescription>
                  Your recent points earning and redemption history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pointsTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No points activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pointsTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center border-b pb-3">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`text-lg font-bold ${
                          transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { tier: 'Bronze', points: '0-999', discount: '5%', benefits: ['Basic support', 'Welcome bonus'] },
                { tier: 'Silver', points: '1000-2499', discount: '10%', benefits: ['Priority support', 'Early access', 'Birthday bonus'] },
                { tier: 'Gold', points: '2500-4999', discount: '15%', benefits: ['Premium support', 'Free shipping', 'Exclusive deals'] },
                { tier: 'Platinum', points: '5000+', discount: '20%', benefits: ['VIP support', 'Premium shipping', 'Exclusive access', 'Personal shopper'] }
              ].map((tier) => (
                <Card key={tier.tier} className={loyaltyData?.tier === tier.tier.toLowerCase() ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {tier.tier === 'Platinum' ? <Crown className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                      {tier.tier}
                    </CardTitle>
                    <CardDescription>{tier.points} points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary mb-3">
                      {tier.discount} OFF
                    </div>
                    <ul className="space-y-2 text-sm">
                      {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;