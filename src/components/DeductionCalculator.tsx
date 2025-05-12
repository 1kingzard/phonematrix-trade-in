
import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DeductionOption {
  id: string;
  label: string;
  deduction: number;
}

interface DeductionCalculatorProps {
  basePrice: number;
  currency: string;
  onValueChange: (finalValue: number) => void;
}

const DeductionCalculator: React.FC<DeductionCalculatorProps> = ({ 
  basePrice, 
  currency, 
  onValueChange 
}) => {
  const exchangeRate = 154; // USD to JMD
  const [selectedDeductions, setSelectedDeductions] = useState<string[]>([]);
  
  // Define deduction options (percentages of the device value)
  const deductionOptions: DeductionOption[] = [
    { id: 'cracked-screen', label: 'Screen is cracked or damaged', deduction: 0.25 },
    { id: 'face-id', label: 'Face ID/Touch ID not working', deduction: 0.15 },
    { id: 'icloud-locked', label: 'Device is iCloud locked', deduction: 0.80 }, // Major deduction
    { id: 'speaker', label: 'Speaker not working properly', deduction: 0.10 },
    { id: 'camera', label: 'Camera not working properly', deduction: 0.10 },
    { id: 'buttons', label: 'Physical buttons damaged', deduction: 0.05 },
    { id: 'battery', label: 'Battery health below 80%', deduction: 0.15 },
    { id: 'water-damage', label: 'Signs of water damage', deduction: 0.30 }
  ];
  
  // Calculate the final value after deductions
  const calculateFinalValue = () => {
    let finalValue = basePrice;
    
    selectedDeductions.forEach((deductionId) => {
      const option = deductionOptions.find((opt) => opt.id === deductionId);
      if (option) {
        finalValue -= basePrice * option.deduction;
      }
    });
    
    // Ensure value doesn't go below zero
    return Math.max(0, finalValue);
  };
  
  // Handle checkbox changes
  const handleDeductionChange = (deductionId: string, checked: boolean) => {
    setSelectedDeductions(prev => {
      if (checked) {
        return [...prev, deductionId];
      } else {
        return prev.filter(id => id !== deductionId);
      }
    });
  };
  
  // Format price display
  const formatPrice = (value: number): string => {
    const priceInCurrency = currency === 'USD' ? value : value * exchangeRate;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceInCurrency);
  };
  
  // Track total deductions
  const totalDeductions = selectedDeductions.reduce((total, deductionId) => {
    const option = deductionOptions.find((opt) => opt.id === deductionId);
    return total + (option ? basePrice * option.deduction : 0);
  }, 0);
  
  // Calculate final value
  const finalValue = calculateFinalValue();
  
  // Update parent component when the final value changes
  useEffect(() => {
    onValueChange(finalValue);
  }, [finalValue, onValueChange]);
  
  return (
    <Card className="border-t-4 border-t-brand-orange">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Device Condition Deductions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Select any issues with your device to calculate the final trade-in value.
        </p>
        
        <div className="space-y-3">
          {deductionOptions.map((option) => (
            <div className="flex items-center space-x-2" key={option.id}>
              <Checkbox 
                id={option.id}
                checked={selectedDeductions.includes(option.id)}
                onCheckedChange={(checked) => 
                  handleDeductionChange(option.id, checked === true)
                }
              />
              <Label htmlFor={option.id} className="flex justify-between w-full">
                <span>{option.label}</span>
                <span className="text-red-500">
                  -{formatPrice(basePrice * option.deduction)}
                </span>
              </Label>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Original Value:</span>
            <span>{formatPrice(basePrice)}</span>
          </div>
          <div className="flex justify-between text-sm text-red-500 mt-1">
            <span>Total Deductions:</span>
            <span>-{formatPrice(totalDeductions)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2">
            <span>Final Trade-in Value:</span>
            <span className="text-brand-blue">{formatPrice(finalValue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeductionCalculator;
