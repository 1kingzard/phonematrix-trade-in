import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { usePartsRole } from '@/hooks/usePartsRole';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Wrench, Package, ShoppingCart, Wallet, Banknote, Boxes, Settings, BarChart3, LogOut } from 'lucide-react';
import InventoryTab from '@/components/parts/InventoryTab';
import SalesTab from '@/components/parts/SalesTab';
import CollectionsTab from '@/components/parts/CollectionsTab';
import DepositsTab from '@/components/parts/DepositsTab';
import MiscOrdersTab from '@/components/parts/MiscOrdersTab';
import SettingsTab from '@/components/parts/SettingsTab';
import ReportsTab from '@/components/parts/ReportsTab';

const PartsAdmin = () => {
  const { role, loading, user } = usePartsRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login?redirect=/parts/admin', { replace: true });
    else if (role !== 'admin') navigate('/', { replace: true });
  }, [role, loading, user, navigate]);

  if (loading || role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Wrench className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auto Parts — Admin</h1>
            <p className="text-sm text-muted-foreground">Private inventory & sales control panel</p>
          </div>
        </div>

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="inventory"><Package className="h-4 w-4 mr-1" />Inventory</TabsTrigger>
            <TabsTrigger value="sales"><ShoppingCart className="h-4 w-4 mr-1" />Sales</TabsTrigger>
            <TabsTrigger value="collections"><Wallet className="h-4 w-4 mr-1" />Collections</TabsTrigger>
            <TabsTrigger value="deposits"><Banknote className="h-4 w-4 mr-1" />Deposits</TabsTrigger>
            <TabsTrigger value="misc"><Boxes className="h-4 w-4 mr-1" />Misc Orders</TabsTrigger>
            <TabsTrigger value="reports"><BarChart3 className="h-4 w-4 mr-1" />Reports</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" />Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="inventory"><InventoryTab /></TabsContent>
          <TabsContent value="sales"><SalesTab /></TabsContent>
          <TabsContent value="collections"><CollectionsTab /></TabsContent>
          <TabsContent value="deposits"><DepositsTab /></TabsContent>
          <TabsContent value="misc"><MiscOrdersTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PartsAdmin;