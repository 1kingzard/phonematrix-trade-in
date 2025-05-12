
import React, { useEffect, useState } from 'react';
import { DeviceData, getUniqueValues } from '../services/deviceDataService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface DeviceFiltersProps {
  devices: DeviceData[];
  onFilterChange: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  os: string;
  brand: string;
  model: string;
  storage: string;
  condition: string;
}

const DeviceFilters: React.FC<DeviceFiltersProps> = ({ devices, onFilterChange }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    os: '',
    brand: '',
    model: '',
    storage: '',
    condition: ''
  });

  // Filter options based on selection hierarchy
  const osOptions = getUniqueValues(devices, 'OS');
  
  const filteredByOS = devices.filter(device => 
    !filters.os || device.OS === filters.os
  );
  const brandOptions = getUniqueValues(filteredByOS, 'Brand');
  
  const filteredByBrand = filteredByOS.filter(device => 
    !filters.brand || device.Brand === filters.brand
  );
  const modelOptions = getUniqueValues(filteredByBrand, 'Model');
  
  const filteredByModel = filteredByBrand.filter(device => 
    !filters.model || device.Model === filters.model
  );
  const storageOptions = getUniqueValues(filteredByModel, 'Storage');
  
  const filteredByStorage = filteredByModel.filter(device => 
    !filters.storage || device.Storage === filters.storage
  );
  const conditionOptions = getUniqueValues(filteredByStorage, 'Condition');

  // Handle filter changes
  const handleFilterChange = (field: keyof FilterOptions, value: string) => {
    let updatedFilters: FilterOptions;
    
    if (field === 'os') {
      // Reset all dependent filters when OS changes
      updatedFilters = {
        ...filters,
        os: value,
        brand: '',
        model: '',
        storage: '',
        condition: ''
      };
    } else if (field === 'brand') {
      // Reset model, storage, condition when brand changes
      updatedFilters = {
        ...filters,
        brand: value,
        model: '',
        storage: '',
        condition: ''
      };
    } else if (field === 'model') {
      // Reset storage and condition when model changes
      updatedFilters = {
        ...filters,
        model: value,
        storage: '',
        condition: ''
      };
    } else if (field === 'storage') {
      // Reset condition when storage changes
      updatedFilters = {
        ...filters,
        storage: value,
        condition: ''
      };
    } else {
      updatedFilters = {
        ...filters,
        [field]: value
      };
    }
    
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow-sm">
      <div className="text-lg font-bold mb-4">Filter Devices</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Operating System Filter */}
        <div className="space-y-2">
          <Label htmlFor="os-select">Operating System</Label>
          <Select 
            value={filters.os} 
            onValueChange={(value) => handleFilterChange('os', value)}
          >
            <SelectTrigger id="os-select">
              <SelectValue placeholder="Select OS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-os">All Operating Systems</SelectItem>
              {osOptions.map((os) => (
                <SelectItem key={os} value={os}>{os}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand Filter */}
        <div className="space-y-2">
          <Label htmlFor="brand-select">Brand</Label>
          <Select 
            value={filters.brand} 
            onValueChange={(value) => handleFilterChange('brand', value)}
            disabled={!filters.os}
          >
            <SelectTrigger id="brand-select">
              <SelectValue placeholder={filters.os ? "Select Brand" : "Select OS first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-brands">All Brands</SelectItem>
              {brandOptions.map((brand) => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Filter */}
        <div className="space-y-2">
          <Label htmlFor="model-select">Model</Label>
          <Select 
            value={filters.model} 
            onValueChange={(value) => handleFilterChange('model', value)}
            disabled={!filters.brand}
          >
            <SelectTrigger id="model-select">
              <SelectValue placeholder={filters.brand ? "Select Model" : "Select Brand first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-models">All Models</SelectItem>
              {modelOptions.map((model) => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Storage Filter */}
        <div className="space-y-2">
          <Label htmlFor="storage-select">Storage</Label>
          <Select 
            value={filters.storage} 
            onValueChange={(value) => handleFilterChange('storage', value)}
            disabled={!filters.model}
          >
            <SelectTrigger id="storage-select">
              <SelectValue placeholder={filters.model ? "Select Storage" : "Select Model first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-storage">All Storage Options</SelectItem>
              {storageOptions.map((storage) => (
                <SelectItem key={storage} value={storage}>{storage}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Condition Filter */}
        <div className="space-y-2">
          <Label htmlFor="condition-select">Condition</Label>
          <Select 
            value={filters.condition} 
            onValueChange={(value) => handleFilterChange('condition', value)}
            disabled={!filters.storage}
          >
            <SelectTrigger id="condition-select">
              <SelectValue placeholder={filters.storage ? "Select Condition" : "Select Storage first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-conditions">All Conditions</SelectItem>
              {conditionOptions.map((condition) => (
                <SelectItem key={condition} value={condition}>{condition}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DeviceFilters;
