
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceData } from '../services/deviceDataService';
import { Package } from 'lucide-react';
import { usePurchaseHistory } from '../contexts/PurchaseHistoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Define currency type 
type CurrencyType = 'USD' | 'JMD';

interface PurchaseFormProps {
  selectedDevice: DeviceData | null;
  currency: CurrencyType;
  exchangeRate: number;
  onSubmitSuccess: () => void;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ 
  selectedDevice,
  currency,
  exchangeRate,
  onSubmitSuccess
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  const { addPurchaseRequest } = usePurchaseHistory();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const destinationEmail = 'infophonematrix@gmail.com';
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(currency === 'USD' ? value : value * exchangeRate);
  };
  
  // Calculate shipping cost (30% of device price) - only for JMD
  const shippingCost = (selectedDevice && currency === 'JMD') ? selectedDevice.Price * 0.3 : 0;
  
  // Device price (directly from spreadsheet)
  const devicePrice = selectedDevice ? selectedDevice.Price : 0;
  
  // Calculate total price
  const totalPrice = selectedDevice ? devicePrice + shippingCost : 0;
  
  // Prepare email subject and body
  const prepareEmail = () => {
    if (!selectedDevice) return;
    
    const subject = `Purchase Request: ${selectedDevice.Brand} ${selectedDevice.Model}`;
    
    let body = `
Purchase Request Details:
------------------------
Customer Name: ${name}
Customer Email: ${email}
Customer Phone: ${phone}
Customer Address: ${address}

Device Details:
* OS: ${selectedDevice.OS}
* Brand: ${selectedDevice.Brand}
* Model: ${selectedDevice.Model}
* Storage: ${selectedDevice.Storage}
* Color: ${selectedDevice.Color}
* Condition: ${selectedDevice.Condition}
* Device Price: ${formatCurrency(selectedDevice.Price)}

Price Breakdown:
* Device Price: ${formatCurrency(devicePrice)}`;

    if (currency === 'JMD') {
      body += `
* Shipping Cost (30%): ${formatCurrency(shippingCost)}`;
    }

    body += `
* Total to Pay: ${formatCurrency(totalPrice)}

Additional Notes:
${notes || "None provided"}
    `;
    
    // Encode for mailto link
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    return `mailto:${destinationEmail}?subject=${encodedSubject}&body=${encodedBody}`;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name || !email || !phone || !address) {
      alert('Please fill all required fields');
      return;
    }
    
    if (!selectedDevice) return;

    // Add to purchase history if user is logged in
    if (user) {
      addPurchaseRequest({
        device: selectedDevice,
        customerInfo: { name, email, phone, address, notes },
        totalPrice: currency === 'USD' ? totalPrice : totalPrice * exchangeRate,
        currency
      });
      
      toast({
        title: "Purchase request saved",
        description: "Your request has been saved to your account history.",
      });
    }
    
    const mailtoLink = prepareEmail();
    if (mailtoLink) {
      window.location.href = mailtoLink;
      onSubmitSuccess();
    }
  };
  
  if (!selectedDevice) {
    return null;
  }
  
  return (
    <Card className="animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-[#d81570] to-[#e83a8e] text-white">
        <CardTitle className="flex items-center gap-2">
          Complete Your Purchase Request
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-400 dark:border-blue-600 rounded-r-md">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Device Selected:</h3>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              {selectedDevice.Brand} {selectedDevice.Model} ({selectedDevice.Storage}, {selectedDevice.Color}, {selectedDevice.Condition})
            </p>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mt-1">
              Price: {formatCurrency(selectedDevice.Price)}
            </p>
          </div>
        </div>
        
        {/* Price Breakdown */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
          <div className="text-sm font-medium mb-2 dark:text-white">Price Breakdown</div>
          <div className="flex justify-between mb-1 dark:text-white">
            <span>Device Price:</span>
            <span>{formatCurrency(selectedDevice.Price)}</span>
          </div>
          
          {currency === 'JMD' && (
            <div className="flex justify-between mb-1 text-amber-700 dark:text-amber-400">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                Shipping Cost (30%):
              </span>
              <span>{formatCurrency(shippingCost)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold pt-2 border-t dark:border-gray-700 mt-2 dark:text-white">
            <span>Total to Pay:</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter your full name"
              required
              className="border-gray-300 focus:border-[#d81570] focus:ring-[#d81570]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email address"
              required
              className="border-gray-300 focus:border-[#d81570] focus:ring-[#d81570]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input 
              id="phone" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="Enter your phone number"
              required
              className="border-gray-300 focus:border-[#d81570] focus:ring-[#d81570]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Shipping Address *</Label>
            <Textarea 
              id="address" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="Enter your shipping address"
              required
              className="border-gray-300 focus:border-[#d81570] focus:ring-[#d81570]"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Any additional details or requests..."
              rows={3}
              className="border-gray-300 focus:border-[#d81570] focus:ring-[#d81570]"
            />
          </div>
          
          <Button type="submit" className="w-full bg-[#d81570] hover:bg-[#e83a8e]">
            Submit Purchase Request
          </Button>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By submitting this form, you'll be redirected to your email client to send the purchase request.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default PurchaseForm;
