
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceData } from '../services/deviceDataService';

// Define currency type to match Index.tsx
type CurrencyType = 'USD' | 'JMD';

interface DeviceCardProps {
  device: DeviceData;
  currency: CurrencyType;
  onClick: () => void;
  selected: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, currency, onClick, selected }) => {
  // Convert USD to JMD (using approximate exchange rate)
  const exchangeRate = 154; // USD to JMD exchange rate
  const price = currency === 'USD' ? device.Price : Math.round(device.Price * exchangeRate);
  
  // Format currency display
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  
  return (
    <Card 
      className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
        selected ? 'border-brand-blue border-2' : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      <CardHeader className="p-4 bg-gray-50 rounded-t-lg">
        <CardTitle className="text-md font-medium">{device.Brand} {device.Model}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Storage:</span>
          <span className="text-sm font-medium">{device.Storage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Color:</span>
          <span className="text-sm font-medium">{device.Color}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Condition:</span>
          <span className="text-sm font-medium">{device.Condition}</span>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">Trade-in Value:</span>
          <span className="text-lg font-bold text-brand-blue">{formattedPrice}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceCard;
