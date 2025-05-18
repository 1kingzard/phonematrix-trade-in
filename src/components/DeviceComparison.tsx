
import React from 'react';
import { X } from 'lucide-react';
import { DeviceData } from '../services/deviceDataService';
import { Button } from '@/components/ui/button';

interface DeviceComparisonProps {
  devices: DeviceData[];
  onRemoveDevice: (device: DeviceData) => void;
  currency: 'USD' | 'JMD';
  exchangeRate: number;
}

const DeviceComparison: React.FC<DeviceComparisonProps> = ({ 
  devices, 
  onRemoveDevice,
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

  // Get unique properties to compare
  const properties = ['Brand', 'Model', 'Storage', 'Color', 'Condition', 'OS', 'Price'];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#d81570]">Device Comparison</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-sm font-medium text-gray-500">Property</th>
              {devices.map((device, index) => (
                <th key={index} className="py-2 px-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{device.Brand} {device.Model}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onRemoveDevice(device)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr key={property} className="border-t border-gray-100">
                <td className="py-3 px-3 text-sm font-medium">{property}</td>
                {devices.map((device, index) => (
                  <td key={index} className="py-3 px-3 text-sm">
                    {property === 'Price' 
                      ? formatCurrency(device[property as keyof DeviceData] as number)
                      : device[property as keyof DeviceData]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeviceComparison;
