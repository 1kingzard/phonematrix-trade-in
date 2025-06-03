
import { useState, useEffect } from 'react';

export interface DiscountCode {
  'Discount Code': string;
  'Assigned To': string;
  'Times Used': number;
  'Percentage Discount Offered': number;
}

// CSV URL from Google Sheets for discount codes
const DISCOUNT_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzEx5rbEB-VABfIyNHPfxepJclVcj8vOjIk-hWEc09l392dOrbIsPsdVtNuwTirA1ofb7eZmsOozzH/pub?output=csv";

// Function to parse discount code CSV data
const parseDiscountCSV = (csvText: string): DiscountCode[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    const discountData: Partial<DiscountCode> = {};
    
    headers.forEach((header, index) => {
      const key = header as keyof DiscountCode;
      if (key === 'Times Used' || key === 'Percentage Discount Offered') {
        discountData[key] = parseFloat(values[index]) || 0;
      } else {
        discountData[key] = values[index];
      }
    });
    
    return discountData as DiscountCode;
  }).filter(code => code['Discount Code']); // Filter out any incomplete rows
};

// Hook to fetch and provide discount code data
export const useDiscountCodes = () => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(DISCOUNT_CSV_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch discount codes');
        }
        const csvText = await response.text();
        const parsedData = parseDiscountCSV(csvText);
        setDiscountCodes(parsedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching discount codes:', err);
        setError('Failed to load discount codes. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return { discountCodes, loading, error };
};

// Function to validate and get discount percentage
export const validateDiscountCode = (code: string, discountCodes: DiscountCode[]): number => {
  const discountCode = discountCodes.find(dc => 
    dc['Discount Code'].toLowerCase() === code.toLowerCase()
  );
  
  if (!discountCode) {
    return 0; // Invalid code
  }
  
  return discountCode['Percentage Discount Offered'];
};
