
import React from 'react';
import { Button } from '@/components/ui/button';

// Define currency type to match Index.tsx
type CurrencyType = 'USD' | 'JMD';

interface CurrencyToggleProps {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ currency, setCurrency }) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-sm font-medium dark:text-gray-300">Currency:</span>
      <div className="flex rounded-md overflow-hidden bg-[#fce4f1] dark:bg-[#471934]">
        <Button
          variant="ghost"
          className={`px-3 py-1 h-9 rounded-r-none ${
            currency === 'USD' 
              ? 'bg-[#ffbfde] text-[#d81570] hover:bg-[#ffbfde] hover:text-[#d81570] dark:bg-[#e83a8e] dark:text-white dark:hover:bg-[#e83a8e]' 
              : 'text-gray-600 hover:text-[#d81570] dark:text-gray-300 dark:hover:text-white'
          }`}
          onClick={() => setCurrency('USD')}
        >
          USD
        </Button>
        <Button
          variant="ghost"
          className={`px-3 py-1 h-9 rounded-l-none ${
            currency === 'JMD' 
              ? 'bg-[#ffbfde] text-[#d81570] hover:bg-[#ffbfde] hover:text-[#d81570] dark:bg-[#e83a8e] dark:text-white dark:hover:bg-[#e83a8e]' 
              : 'text-gray-600 hover:text-[#d81570] dark:text-gray-300 dark:hover:text-white'
          }`}
          onClick={() => setCurrency('JMD')}
        >
          JMD
        </Button>
      </div>
    </div>
  );
};

export default CurrencyToggle;
