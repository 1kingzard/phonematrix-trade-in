import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { usePartsRole } from '@/hooks/usePartsRole';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Wrench, Package, ShoppingCart, Wallet, Banknote, Boxes, Settings, BarChart3, LogOut, History, Tag } from 'lucide-react';
import PriceListTab from '@/components/parts/PriceListTab';
import InventoryTab from '@/components/parts/InventoryTab';
import SalesTab from '@/components/parts/SalesTab';
import CollectionsTab from '@/components/parts/CollectionsTab';
import DepositsTab from '@/components/parts/DepositsTab';
import MiscOrdersTab from '@/components/parts/MiscOrdersTab';
import SettingsTab from '@/components/parts/SettingsTab';
import ReportsTab from '@/components/parts/ReportsTab';
import ActivityTab from '@/components/parts/ActivityTab';

const PartsAdmin = () => {
  const { role, loading, user } = usePartsRole();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login?redirect=/parts/admin', { replace: true });
    else if (role !== 'admin') navigate('/', { replace: true });
  }, [role, loading, user, navigate]);

  if (loading || role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Auto Parts</h1>
              <p className="text-sm text-muted-foreground">Private inventory & sales control panel</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 rounded-full">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 rounded-xl bg-muted/70 backdrop-blur p-1.5 sticky top-3 z-20 border border-border/50 shadow-sm">
            <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Package className="h-4 w-4 mr-1.5" />Inventory</TabsTrigger>
            <TabsTrigger value="pricelist" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Tag className="h-4 w-4 mr-1.5" />Price List</TabsTrigger>
            <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><ShoppingCart className="h-4 w-4 mr-1.5" />Sales</TabsTrigger>
            <TabsTrigger value="collections" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Wallet className="h-4 w-4 mr-1.5" />Collections</TabsTrigger>
            <TabsTrigger value="deposits" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Banknote className="h-4 w-4 mr-1.5" />Deposits</TabsTrigger>
            <TabsTrigger value="misc" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Boxes className="h-4 w-4 mr-1.5" />Misc Orders</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><BarChart3 className="h-4 w-4 mr-1.5" />Reports</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><History className="h-4 w-4 mr-1.5" />Activity</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="h-4 w-4 mr-1.5" />Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="inventory"><InventoryTab /></TabsContent>
          <TabsContent value="pricelist"><PriceListTab isAdmin /></TabsContent>
          <TabsContent value="sales"><SalesTab /></TabsContent>
          <TabsContent value="collections"><CollectionsTab /></TabsContent>
          <TabsContent value="deposits"><DepositsTab /></TabsContent>
          <TabsContent value="misc"><MiscOrdersTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
          <TabsContent value="activity"><ActivityTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PartsAdmin;