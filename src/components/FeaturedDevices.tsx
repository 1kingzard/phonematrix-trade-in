
import React from 'react';
import { DeviceData } from '../services/deviceDataService';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface FeaturedDevicesProps {
  devices: DeviceData[];
  onSelectDevice: (device: DeviceData) => void;
  currency: 'USD' | 'JMD';
  exchangeRate: number;
}

const FeaturedDevices: React.FC<FeaturedDevicesProps> = ({ 
  devices, 
  onSelectDevice, 
  currency,
  exchangeRate 
}) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(currency === 'USD' ? value : value * exchangeRate);
  };

  if (devices.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-[#fce4f1] to-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Star className="h-5 w-5 text-[#d81570] fill-[#d81570]" />
        <h2 className="text-2xl font-semibold text-[#d81570]">Featured Devices</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="absolute -top-3 -right-3 bg-[#d81570] text-white text-xs py-1 px-3 rounded-full">
              Featured
            </div>
            <div className="relative">
              <h3 className="font-medium text-lg mb-1">{device.Brand} {device.Model}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {device.Storage} • {device.Color} • {device.Condition}
              </p>
              <p className="text-[#d81570] font-bold text-xl mb-4">{formatCurrency(device.Price)}</p>
              
              <Button 
                className="w-full bg-[#d81570] hover:bg-[#e83a8e]" 
                onClick={() => onSelectDevice(device)}
              >
                Select Device
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedDevices;
