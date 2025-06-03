
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePurchaseHistory } from '../contexts/PurchaseHistoryContext';
import { Calendar, Package } from 'lucide-react';

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({ isOpen, onClose }) => {
  const { requests, getTotalPurchases, getTotalSpent } = usePurchaseHistory();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase History</DialogTitle>
        </DialogHeader>
        
        {/* Purchase Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalPurchases()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${getTotalSpent().toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Requests */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Purchase Requests</h3>
          
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No purchase requests yet</p>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-[#d81570]">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {request.device.Brand} {request.device.Model}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {request.device.Storage} • {request.device.Color} • {request.device.Condition}
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Customer Info:</p>
                      <p>{request.customerInfo.name}</p>
                      <p>{request.customerInfo.email}</p>
                      <p>{request.customerInfo.phone}</p>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Request Date:
                      </p>
                      <p>{request.requestDate.toLocaleDateString()}</p>
                      <p className="font-bold text-[#d81570] mt-2">
                        Total: {formatCurrency(request.totalPrice, request.currency)}
                      </p>
                    </div>
                  </div>
                  {request.customerInfo.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="font-medium text-sm">Notes:</p>
                      <p className="text-sm text-gray-600">{request.customerInfo.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseHistoryModal;
