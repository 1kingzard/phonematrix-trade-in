import { useState, useEffect } from 'react';

// Define the type for our device data
export interface DeviceData {
  OS: string;
  Brand: string;
  Model: string;
  Condition: string;
  Price: number;
  Storage: string;
  Color: string;
}

// CSV URL from Google Sheets
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQL9a5fmRtcYCgO0q9VHHSvIIQM_kJryefPZDQmzbCoPuw7jtlpMgLVV5JEgoi60lAtjIbZjD46QVJw/pub?output=csv";

// Function to parse CSV data
const parseCSV = (csvText: string): DeviceData[] => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    const deviceData: Partial<DeviceData> = {};
    
    headers.forEach((header, index) => {
      const key = header as keyof DeviceData;
      if (key === 'Price') {
        deviceData[key] = parseFloat(values[index]) || 0;
      } else {
        deviceData[key] = values[index];
      }
    });
    
    return deviceData as DeviceData;
  }).filter(device => device.Model && device.Price); // Filter out any incomplete rows
};

// Hook to fetch and provide device data
export const useDeviceData = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch device data');
        }
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        setDevices(parsedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching device data:', err);
        setError('Failed to load device data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return { devices, loading, error };
};

// Hook to get the current exchange rate
export const useExchangeRate = () => {
  const [exchangeRate, setExchangeRate] = useState<number>(158); // Default fallback rate
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();

        if (data.rates && data.rates.JMD) {
          setExchangeRate(data.rates.JMD);
          console.log("Successfully fetched exchange rate:", data.rates.JMD);
        } else {
          console.error("Error fetching exchange rate: Invalid response", data);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        // Keep the fallback rate if there's an error
      } finally {
        setLoading(false);
      }
    };
    
    fetchExchangeRate();
  }, []);
  
  return { exchangeRate, loading };
};

// Function to get unique values for a specific field from device data
export const getUniqueValues = (devices: DeviceData[], field: keyof DeviceData): string[] => {
  const uniqueValues = new Set(devices.map(device => device[field] as string));
  return Array.from(uniqueValues).filter(Boolean).sort();
};

// Calculate the price difference between two devices
export const calculatePriceDifference = (
  tradeInDevice: DeviceData | null, 
  upgradeDevice: DeviceData | null, 
  finalTradeValue: number
): number => {
  if (!tradeInDevice || !upgradeDevice) {
    return 0;
  }
  
  return upgradeDevice.Price - finalTradeValue;
};

// Calculate shipping cost for upgraded device in JMD (30% of device price)
export const calculateShippingCost = (upgradeDevicePrice: number): number => {
  return upgradeDevicePrice * 0.3; // 30% of the upgrade device price
};
