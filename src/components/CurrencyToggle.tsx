
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type CurrencyType = 'USD' | 'JMD';

interface CurrencyToggleProps {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ currency, setCurrency }) => {
  return (
    <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-2">
      <RadioGroup 
        value={currency} 
        onValueChange={(value) => setCurrency(value as CurrencyType)}
        className="flex items-center space-x-2"
      >
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="USD" id="usd" />
          <Label htmlFor="usd" className="cursor-pointer">USD</Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="JMD" id="jmd" />
          <Label htmlFor="jmd" className="cursor-pointer">JMD</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default CurrencyToggle;
