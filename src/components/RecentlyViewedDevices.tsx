
import React from 'react';
import { DeviceData } from '../services/deviceDataService';
import { Button } from '@/components/ui/button';
import { Clock, Plus } from 'lucide-react';

interface RecentlyViewedDevicesProps {
  devices: DeviceData[];
  onSelectDevice: (device: DeviceData) => void;
  onCompareDevice?: (device: DeviceData) => void;
  currency: 'USD' | 'JMD';
  exchangeRate: number;
}

const RecentlyViewedDevices: React.FC<RecentlyViewedDevicesProps> = ({ 
  devices, 
  onSelectDevice, 
  onCompareDevice,
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-[#d81570]" />
        <h2 className="text-xl font-semibold text-[#d81570]">Recently Viewed</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {devices.map((device, index) => (
          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium text-base mb-1">{device.Brand} {device.Model}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {device.Storage} • {device.Color} • {device.Condition}
            </p>
            <p className="text-[#d81570] font-bold mb-3">{formatCurrency(device.Price)}</p>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => onSelectDevice(device)}
                className="bg-[#d81570] hover:bg-[#e83a8e] text-xs"
              >
                Select
              </Button>
              
              {onCompareDevice && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onCompareDevice(device)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> Compare
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewedDevices;
