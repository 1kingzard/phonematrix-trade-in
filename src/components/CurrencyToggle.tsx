
import React from 'react';
import { Button } from '@/components/ui/button';

interface CurrencyToggleProps {
  currency: string;
  setCurrency: (currency: string) => void;
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ currency, setCurrency }) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-sm font-medium">Currency:</span>
      <div className="flex rounded-md overflow-hidden">
        <Button
          variant={currency === 'USD' ? 'default' : 'outline'}
          className="px-3 py-1 h-9 rounded-r-none"
          onClick={() => setCurrency('USD')}
        >
          USD
        </Button>
        <Button
          variant={currency === 'JMD' ? 'default' : 'outline'}
          className="px-3 py-1 h-9 rounded-l-none"
          onClick={() => setCurrency('JMD')}
        >
          JMD
        </Button>
      </div>
    </div>
  );
};

export default CurrencyToggle;
