
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface OrderManagementProps {
  orders: PurchaseRequest[];
  onRefresh: () => void;
  user: any;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ orders, onRefresh, user }) => {
  const { toast } = useToast();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
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

  const handleCreateOrder = async () => {
    try {
      const orderData = {
        user_id: user?.id,
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
      onRefresh();
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
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
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
  );
};

export default OrderManagement;
