
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useDiscountCodes, validateDiscountCode } from '../services/discountCodeService';

interface DiscountCodeInputProps {
  onDiscountApplied: (discount: number, code: string) => void;
  disabled?: boolean;
}

const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({ 
  onDiscountApplied, 
  disabled = false 
}) => {
  const [code, setCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  
  const { discountCodes, loading } = useDiscountCodes();
  
  const handleApplyCode = () => {
    if (!code.trim() || loading) return;
    
    setStatus('checking');
    
    // Simulate a brief check delay for better UX
    setTimeout(() => {
      const discount = validateDiscountCode(code, discountCodes);
      
      if (discount > 0) {
        setStatus('valid');
        setAppliedDiscount(discount);
        setAppliedCode(code);
        onDiscountApplied(discount, code);
      } else {
        setStatus('invalid');
        setAppliedDiscount(0);
        setAppliedCode('');
        onDiscountApplied(0, '');
      }
    }, 500);
  };
  
  const handleRemoveCode = () => {
    setCode('');
    setAppliedDiscount(0);
    setAppliedCode('');
    setStatus('idle');
    onDiscountApplied(0, '');
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Validating code...';
      case 'valid':
        return `Discount applied: ${appliedDiscount}% off`;
      case 'invalid':
        return 'Invalid discount code';
      default:
        return '';
    }
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor="discount-code">Discount Code</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id="discount-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter discount code"
            disabled={disabled || loading || status === 'valid'}
            className="border-gray-300 focus:border-[#d81570] focus:ring-[#d81570]"
          />
        </div>
        {status === 'valid' ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemoveCode}
            disabled={disabled}
            className="shrink-0"
          >
            Remove
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleApplyCode}
            disabled={disabled || loading || !code.trim()}
            className="bg-[#d81570] hover:bg-[#e83a8e] shrink-0"
          >
            {status === 'checking' ? 'Checking...' : 'Apply'}
          </Button>
        )}
      </div>
      
      {status !== 'idle' && (
        <div className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          <span className={
            status === 'valid' ? 'text-green-600' : 
            status === 'invalid' ? 'text-red-600' : 
            'text-blue-600'
          }>
            {getStatusMessage()}
          </span>
        </div>
      )}
    </div>
  );
};

export default DiscountCodeInput;
