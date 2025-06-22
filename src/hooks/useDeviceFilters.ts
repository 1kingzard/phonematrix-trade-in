
import { useState, useMemo } from 'react';

export interface DeviceFilters {
  brand: string;
  condition: string;
  priceRange: [number, number];
  sortBy: string;
}

export const useDeviceFilters = (devices: any[]) => {
  const [filters, setFilters] = useState<DeviceFilters>({
    brand: '',
    condition: '',
    priceRange: [0, 2000],
    sortBy: 'price-asc'
  });

  const filteredDevices = useMemo(() => {
    let filtered = devices.filter(device => {
      const matchesBrand = !filters.brand || device.brand.toLowerCase().includes(filters.brand.toLowerCase());
      const matchesCondition = !filters.condition || device.condition === filters.condition;
      const matchesPrice = device.price >= filters.priceRange[0] && device.price <= filters.priceRange[1];
      
      return matchesBrand && matchesCondition && matchesPrice;
    });

    // Sort devices
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'brand':
        filtered.sort((a, b) => a.brand.localeCompare(b.brand));
        break;
      default:
        break;
    }

    return filtered;
  }, [devices, filters]);

  return {
    filters,
    setFilters,
    filteredDevices
  };
};
