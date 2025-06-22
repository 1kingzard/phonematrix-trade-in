
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface InventoryManagementProps {
  inventory: InventoryItem[];
  onRefresh: () => void;
  user: any;
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({ inventory, onRefresh, user }) => {
  const { toast } = useToast();
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [saleEmail, setSaleEmail] = useState('');
  const [salePrice, setSalePrice] = useState<number>(0);
  
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
      onRefresh();
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
      onRefresh();
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

  const handleMarkAsSold = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setSalePrice(item.price);
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
      const userId = user?.id;

      if (!userId) {
        toast({
          title: "Error",
          description: "Admin user not found",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc('mark_inventory_sold', {
        inventory_id: selectedInventoryItem.id,
        user_id: userId,
        sale_price: salePrice
      });

      if (error) throw error;

      if (data) {
        await supabase
          .from('purchase_requests')
          .update({
            customer_info: {
              email: saleEmail,
              source: 'admin_inventory_sale'
            },
            admin_notes: `Inventory sale to customer: ${saleEmail}`
          })
          .eq('id', data);
      }

      toast({
        title: "Success",
        description: "Item marked as sold and order created successfully",
      });

      setIsSaleModalOpen(false);
      setSelectedInventoryItem(null);
      setSaleEmail('');
      setSalePrice(0);
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
    <>
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
    </>
  );
};

export default InventoryManagement;
