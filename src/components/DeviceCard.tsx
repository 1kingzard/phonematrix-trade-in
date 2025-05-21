
import React from 'react';
import { DeviceData } from '../services/deviceDataService';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface DeviceCardProps {
  device: DeviceData;
  currency: 'USD' | 'JMD';
  exchangeRate: number;
  onClick: () => void;
  selected?: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, currency, exchangeRate, onClick, selected = false }) => {
  // Format the price according to the selected currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(currency === 'USD' ? device.Price : device.Price * exchangeRate);

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-all ${
        selected ? 'ring-2 ring-[#d81570]' : 'hover:shadow-md'
      }`}
    >
      <div className="space-y-2">
        <h3 className="font-medium text-lg dark:text-white">{device.Brand} {device.Model}</h3>
        <p className="text-gray-600 dark:text-gray-300">
          {device.Storage} • {device.Color} • {device.Condition}
        </p>
        <p className="font-bold text-xl text-[#d81570] dark:text-[#ff7eb6]">{formattedPrice}</p>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">OS: {device.OS}</span>
          
          <Button
            onClick={onClick}
            className={`px-4 py-2 ${
              selected 
                ? 'bg-[#d81570] hover:bg-[#e83a8e] text-white' 
                : 'bg-white dark:bg-gray-700 text-[#d81570] dark:text-[#ff7eb6] border border-[#d81570] dark:border-[#ff7eb6] hover:bg-[#fce4f1] dark:hover:bg-gray-600'
            }`}
            size="sm"
          >
            {selected ? (
              <>
                <Check className="mr-1 h-4 w-4" /> Selected
              </>
            ) : 'Select'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
