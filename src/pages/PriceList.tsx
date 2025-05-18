
import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import { useDeviceData, DeviceData, useExchangeRate, getUniqueValues } from '../services/deviceDataService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CurrencyToggle from '../components/CurrencyToggle';
import OnboardingGuide from '../components/OnboardingGuide';
import DeviceConditionImages from '../components/DeviceConditionImages';
import PurchaseForm from '../components/PurchaseForm';
import { ChevronRight } from 'lucide-react';

// Define currency type
type CurrencyType = 'USD' | 'JMD';

const PriceList = () => {
  const { devices, loading, error } = useDeviceData();
  const { exchangeRate } = useExchangeRate();
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  
  // Filter state
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedStorage, setSelectedStorage] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  
  // Get unique values for filters
  const brands = getUniqueValues(devices, 'Brand');
  
  // Get models for selected brand
  const models = selectedBrand
    ? getUniqueValues(devices.filter(d => d.Brand === selectedBrand), 'Model')
    : [];
    
  // Get storage options for selected brand and model
  const storageOptions = selectedModel
    ? getUniqueValues(devices.filter(d => d.Brand === selectedBrand && d.Model === selectedModel), 'Storage')
    : [];
    
  // Get condition options
  const conditionOptions = selectedStorage
    ? getUniqueValues(
        devices.filter(
          d => d.Brand === selectedBrand && 
          d.Model === selectedModel && 
          d.Storage === selectedStorage
        ), 
        'Condition'
      )
    : [];
  
  // Filter devices based on selections
  const filteredDevices = devices.filter(device => {
    return (!selectedBrand || device.Brand === selectedBrand) &&
           (!selectedModel || device.Model === selectedModel) &&
           (!selectedStorage || device.Storage === selectedStorage) &&
           (!selectedCondition || device.Condition === selectedCondition);
  });
  
  // Selected device for purchase
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  
  // Refs for scrolling
  const filtersRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const purchaseFormRef = useRef<HTMLDivElement>(null);
  
  // Show condition images state
  const [showConditionImages, setShowConditionImages] = useState(false);
  
  // Handle device selection
  const handleDeviceSelect = (device: DeviceData) => {
    setSelectedDevice(device);
    // Scroll to purchase form
    setTimeout(() => {
      purchaseFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  // Handle form submission success
  const handleSubmitSuccess = () => {
    setSelectedDevice(null);
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedStorage('');
    setSelectedCondition('');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(currency === 'USD' ? price : price * exchangeRate);
  };
  
  // Scroll to results when filters are updated
  useEffect(() => {
    if (selectedBrand && selectedModel && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedBrand, selectedModel, selectedStorage, selectedCondition]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <HeroSection 
        title="Phone Price List"
        subtitle="Browse our selection of quality devices at competitive prices"
        imageSrc="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1600&q=80"
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Onboarding Guide */}
        <OnboardingGuide
          steps={[
            {
              title: "Welcome to Price List",
              description: "Browse our devices and submit a purchase request",
              image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80"
            },
            {
              title: "Select Device Filters",
              description: "Use the filters to find the device you're looking for",
              image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=500&q=80"
            },
            {
              title: "View Device Details",
              description: "Browse the device list and select one to purchase",
              image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80"
            },
            {
              title: "Complete Purchase Request",
              description: "Fill out the form to submit your purchase request",
              image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80"
            }
          ]}
        />
        
        {/* Currency Toggle */}
        <div className="flex justify-end mb-4">
          <CurrencyToggle
            currency={currency}
            setCurrency={setCurrency}
          />
        </div>
        
        {/* Device Condition Guide */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            className="w-full md:w-auto"
            onClick={() => setShowConditionImages(!showConditionImages)}
          >
            {showConditionImages ? 'Hide' : 'Show'} Device Condition Guide
          </Button>
          <div className="mt-4">
            <DeviceConditionImages isVisible={showConditionImages} />
          </div>
        </div>
        
        {/* Filters */}
        <div ref={filtersRef} className="mb-8">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Find Your Device</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <Select
                  value={selectedBrand}
                  onValueChange={(value) => {
                    setSelectedBrand(value);
                    setSelectedModel('');
                    setSelectedStorage('');
                    setSelectedCondition('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-brands">All Brands</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <Select
                  value={selectedModel}
                  onValueChange={(value) => {
                    setSelectedModel(value);
                    setSelectedStorage('');
                    setSelectedCondition('');
                  }}
                  disabled={!selectedBrand}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedBrand ? "Select Model" : "Select Brand First"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-models">All Models</SelectItem>
                    {models.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Storage</label>
                <Select
                  value={selectedStorage}
                  onValueChange={(value) => {
                    setSelectedStorage(value);
                    setSelectedCondition('');
                  }}
                  disabled={!selectedModel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedModel ? "Select Storage" : "Select Model First"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-storage">All Storage</SelectItem>
                    {storageOptions.map(storage => (
                      <SelectItem key={storage} value={storage}>{storage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <Select
                  value={selectedCondition}
                  onValueChange={setSelectedCondition}
                  disabled={!selectedStorage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedStorage ? "Select Condition" : "Select Storage First"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-conditions">All Conditions</SelectItem>
                    {conditionOptions.map(condition => (
                      <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Results */}
        <div ref={resultsRef}>
          {loading ? (
            <p className="text-center py-8">Loading devices...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-8">Error: {error}</p>
          ) : filteredDevices.length === 0 ? (
            <p className="text-center py-8">No devices found. Please adjust your filters.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device, index) => (
                    <TableRow key={index}>
                      <TableCell>{device.Brand}</TableCell>
                      <TableCell>{device.Model}</TableCell>
                      <TableCell>{device.Storage}</TableCell>
                      <TableCell>{device.Color}</TableCell>
                      <TableCell>{device.Condition}</TableCell>
                      <TableCell className="font-bold">{formatPrice(device.Price)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm"
                          className="bg-[#d81570] hover:bg-[#e83a8e] text-white"
                          onClick={() => handleDeviceSelect(device)}
                        >
                          Select <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        {/* Purchase Form */}
        {selectedDevice && (
          <div ref={purchaseFormRef} className="mt-8">
            <PurchaseForm
              selectedDevice={selectedDevice}
              currency={currency}
              exchangeRate={exchangeRate}
              onSubmitSuccess={handleSubmitSuccess}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default PriceList;
