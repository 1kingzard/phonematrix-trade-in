
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceData } from '../services/deviceDataService';

interface EmailFormProps {
  selectedDevice: DeviceData | null;
  finalTradeValue: number;
  currency: string;
  onSubmitSuccess: () => void;
}

const EmailForm: React.FC<EmailFormProps> = ({ 
  selectedDevice, 
  finalTradeValue,
  currency,
  onSubmitSuccess
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  const destinationEmail = 'infophonematrix@gmail.com';
  const exchangeRate = 154;
  
  // Format the trade-in value
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(currency === 'USD' ? finalTradeValue : finalTradeValue * exchangeRate);
  
  // Prepare email subject and body
  const prepareEmail = () => {
    if (!selectedDevice) return;
    
    const subject = `Trade-in Request: ${selectedDevice.Brand} ${selectedDevice.Model}`;
    
    const body = `
Trade-in Request Details:
------------------------
Customer Name: ${name}
Customer Email: ${email}
Customer Phone: ${phone}

Device Details:
* OS: ${selectedDevice.OS}
* Brand: ${selectedDevice.Brand}
* Model: ${selectedDevice.Model}
* Storage: ${selectedDevice.Storage}
* Color: ${selectedDevice.Color}
* Condition: ${selectedDevice.Condition}

Final Trade-in Value: ${formattedValue} (${currency})

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
      <CardHeader>
        <CardTitle>Request Trade-in Quote</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter your full name"
              required
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
            />
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Selected Device</div>
            <div className="mb-1">{selectedDevice.Brand} {selectedDevice.Model}</div>
            <div className="mb-1 text-sm text-gray-600">
              {selectedDevice.Storage}, {selectedDevice.Color}, {selectedDevice.Condition}
            </div>
            <div className="font-bold text-brand-blue">{formattedValue}</div>
          </div>
          
          <Button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue/90">
            Submit Trade-in Request
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
