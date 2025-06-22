
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface ReferralCodeManagementProps {
  referralCodes: ReferralCode[];
  onRefresh: () => void;
  user: any;
}

const ReferralCodeManagement: React.FC<ReferralCodeManagementProps> = ({ referralCodes, onRefresh, user }) => {
  const { toast } = useToast();
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
      onRefresh();
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
      onRefresh();
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

  return (
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
  );
};

export default ReferralCodeManagement;
