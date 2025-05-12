
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceData } from '../services/deviceDataService';

// Define currency type to match Index.tsx
type CurrencyType = 'USD' | 'JMD';

interface DeviceCardProps {
  device: DeviceData;
  currency: CurrencyType;
  exchangeRate: number;
  onClick: () => void;
  selected: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, currency, exchangeRate, onClick, selected }) => {
  // Convert USD to JMD using the current exchange rate
  const price = currency === 'USD' ? device.Price : Math.round(device.Price * exchangeRate);
  
  // Format currency display
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  
  // Get OS indicator class
  const getOsIndicatorClass = () => {
    return device.OS === 'iOS' ? 'ios-indicator' : 'android-indicator';
  };
  
  return (
    <Card 
      className={`hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-1 ${
        selected ? 'border-[#d81570] border-2' : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      <CardHeader className="p-4 bg-gray-50 rounded-t-lg">
        <div className="flex items-center">
          <div className={`os-indicator ${getOsIndicatorClass()} mr-2 text-xs`}>
            {device.OS === 'iOS' ? 'iOS' : 'A'}
          </div>
          <CardTitle className="text-md font-medium">{device.Brand} {device.Model}</CardTitle>
        </div>
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
          <span className="text-lg font-bold text-[#d81570]">{formattedPrice}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceCard;
