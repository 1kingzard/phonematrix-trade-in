
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceData } from '../services/deviceDataService';
import { Package } from 'lucide-react';

// Define currency type to match Index.tsx
type CurrencyType = 'USD' | 'JMD';

interface EmailFormProps {
  selectedDevice: DeviceData | null;
  upgradeDevice: DeviceData | null;
  finalTradeValue: number;
  priceDifference: number;
  shippingCost: number;
  currency: CurrencyType;
  exchangeRate: number;
  onSubmitSuccess: () => void;
}

const EmailForm: React.FC<EmailFormProps> = ({ 
  selectedDevice,
  upgradeDevice,
  finalTradeValue,
  priceDifference,
  shippingCost,
  currency,
  exchangeRate,
  onSubmitSuccess
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
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
  
  // Prepare email subject and body
  const prepareEmail = () => {
    if (!selectedDevice) return;
    
    const subject = upgradeDevice 
      ? `Trade-in & Upgrade Request: ${selectedDevice.Brand} ${selectedDevice.Model} to ${upgradeDevice.Brand} ${upgradeDevice.Model}`
      : `Trade-in Request: ${selectedDevice.Brand} ${selectedDevice.Model}`;
    
    let body = `
Trade-in Request Details:
------------------------
Customer Name: ${name}
Customer Email: ${email}
Customer Phone: ${phone}

Trade-in Device:
* OS: ${selectedDevice.OS}
* Brand: ${selectedDevice.Brand}
* Model: ${selectedDevice.Model}
* Storage: ${selectedDevice.Storage}
* Color: ${selectedDevice.Color}
* Condition: ${selectedDevice.Condition}
* Final Trade-in Value: ${formatCurrency(finalTradeValue)}`;

    if (upgradeDevice) {
      body += `

Upgrade Device:
* OS: ${upgradeDevice.OS}
* Brand: ${upgradeDevice.Brand}
* Model: ${upgradeDevice.Model}
* Storage: ${upgradeDevice.Storage}
* Color: ${upgradeDevice.Color}
* Condition: ${upgradeDevice.Condition}
* Price: ${formatCurrency(upgradeDevice.Price)}

Price Breakdown:
* Price Difference: ${formatCurrency(priceDifference)}`;

      if (currency === 'JMD') {
        body += `
* Shipping Cost (30% of upgraded device): ${formatCurrency(shippingCost)}`;
      }

      body += `
* Total to Pay: ${formatCurrency(priceDifference + shippingCost)}`;
    }
    
    body += `

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
    if (!name || !email || !phone) {
      alert('Please fill all required fields');
      return;
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
    <Card>
      <CardHeader className="bg-gradient-to-r from-[#d81570] to-[#e83a8e] text-white">
        <CardTitle>
          {upgradeDevice 
            ? "Complete Your Trade-in & Upgrade Request" 
            : "Request Trade-in Quote"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
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
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Any additional details about your device..."
              rows={3}
              className="border-gray-300 focus:border-[#d81570] focus:ring-[#d81570]"
            />
          </div>
          
          <div className="rounded-lg space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium mb-2">Trade-in Device</div>
              <div className="mb-1">{selectedDevice.Brand} {selectedDevice.Model}</div>
              <div className="mb-1 text-sm text-gray-600">
                {selectedDevice.Storage}, {selectedDevice.Color}, {selectedDevice.Condition}
              </div>
              <div className="font-bold text-[#d81570]">{formatCurrency(finalTradeValue)}</div>
            </div>
            
            {upgradeDevice && (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium mb-2">Upgrade Device</div>
                  <div className="mb-1">{upgradeDevice.Brand} {upgradeDevice.Model}</div>
                  <div className="mb-1 text-sm text-gray-600">
                    {upgradeDevice.Storage}, {upgradeDevice.Color}, {upgradeDevice.Condition}
                  </div>
                  <div className="font-bold text-[#d81570]">{formatCurrency(upgradeDevice.Price)}</div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium mb-2">Price Breakdown</div>
                  <div className="flex justify-between mb-1">
                    <span>Price Difference:</span>
                    <span>{formatCurrency(priceDifference)}</span>
                  </div>
                  
                  {currency === 'JMD' && (
                    <div className="flex justify-between mb-1 text-amber-700">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Shipping Cost (30% of upgrade):
                      </span>
                      <span>{formatCurrency(shippingCost)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold">
                    <span>Total to Pay:</span>
                    <span>{formatCurrency(priceDifference + shippingCost)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <Button type="submit" className="w-full bg-[#d81570] hover:bg-[#e83a8e]">
            Submit Request
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            By submitting this form, you'll be redirected to your email client to send the trade-in request.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmailForm;
