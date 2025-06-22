
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminToolsProps {
  orders: any[];
  inventory: any[];
  referralCodes: any[];
}

const AdminTools: React.FC<AdminToolsProps> = ({ orders, inventory, referralCodes }) => {
  const { toast } = useToast();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

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

  return (
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
  );
};

export default AdminTools;
