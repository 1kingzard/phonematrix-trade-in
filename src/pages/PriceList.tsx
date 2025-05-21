
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { ChevronRight, ArrowUp, ArrowDown, ChevronLeft, ChevronDown } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SortDropdown, { SortOption } from '../components/SortDropdown';
import DeviceComparison from '../components/DeviceComparison';
import RecentlyViewedDevices from '../components/RecentlyViewedDevices';
import FeaturedDevices from '../components/FeaturedDevices';
import ThemeToggle from '../components/ThemeToggle';
import ScrollToTop from '../components/ScrollToTop';
import useLocalStorage from '../hooks/useLocalStorage';
import { toast } from '@/components/ui/use-toast';

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
  
  // Search and sort state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption | undefined>(undefined);
  
  // Show mobile swipe hint state
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  
  // Comparison state
  const [devicesToCompare, setDevicesToCompare] = useState<DeviceData[]>([]);
  
  // Recently viewed devices
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<DeviceData[]>('recentlyViewedDevices', []);
  
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
  
  // Helper function to sort conditions in the correct order
  const sortConditions = (conditions: string[]): string[] => {
    const order = { "Like New": 0, "Good": 1, "Fair": 2, "Poor": 3 };
    return [...conditions].sort((a, b) => {
      return (order[a as keyof typeof order] || 99) - (order[b as keyof typeof order] || 99);
    });
  };
  
  // Sort the condition options in the correct order
  const sortedConditionOptions = sortConditions(conditionOptions);
  
  // Filter devices based on selections and search term
  const filteredDevices = devices.filter(device => {
    // Apply standard filters
    const standardFilters = 
      (!selectedBrand || device.Brand === selectedBrand) &&
      (!selectedModel || device.Model === selectedModel) &&
      (!selectedStorage || device.Storage === selectedStorage) &&
      (!selectedCondition || device.Condition === selectedCondition);
    
    // Apply search term filter
    const searchFilter = !searchTerm || 
      device.Brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.Model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.Storage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.Color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.Condition.toLowerCase().includes(searchTerm.toLowerCase());
    
    return standardFilters && searchFilter;
  });
  
  // Sort filtered devices
  const sortedDevices = [...filteredDevices];
  if (sortOption) {
    sortedDevices.sort((a, b) => {
      const key = sortOption.value as keyof DeviceData;
      const valueA = a[key];
      const valueB = b[key];
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOption.direction === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      } 
      
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOption.direction === 'asc' 
          ? valueA - valueB 
          : valueB - valueA;
      }
      
      return 0;
    });
  }
  
  // Set the featured devices with the specific models requested
  const createFeaturedDevice = (brand: string, model: string, storage: string, condition: string, price: number): DeviceData => {
    return {
      Brand: brand,
      Model: model,
      Storage: storage,
      Color: brand === 'Samsung' ? 'Black' : 'Graphite',
      Condition: condition,
      OS: brand === 'Samsung' ? 'Android' : 'iOS',
      Price: price
    };
  };
  
  const featuredDevices = [
    createFeaturedDevice('Apple', 'iPhone 12', '128GB', 'Good', 350),
    createFeaturedDevice('Apple', 'iPhone 14 Plus', '128GB', 'Very Good', 650),
    createFeaturedDevice('Samsung', 'S23', '128GB', 'Good', 550)
  ];
  
  // Selected device for purchase
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  
  // Refs for scrolling
  const filtersRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const purchaseFormRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Show condition images state
  const [showConditionImages, setShowConditionImages] = useState(false);
  
  // Handle device selection
  const handleDeviceSelect = (device: DeviceData) => {
    setSelectedDevice(device);
    
    // Add to recently viewed
    if (!recentlyViewed.some(item => 
      item.Brand === device.Brand && 
      item.Model === device.Model && 
      item.Storage === device.Storage && 
      item.Condition === device.Condition
    )) {
      setRecentlyViewed(prev => [device, ...prev.slice(0, 4)]);
    }
    
    // Scroll to purchase form
    setTimeout(() => {
      purchaseFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  // Handle comparison
  const handleAddToComparison = (device: DeviceData) => {
    if (devicesToCompare.length >= 3) {
      toast({
        title: "Maximum Comparison Limit",
        description: "You can compare up to 3 devices at a time",
        variant: "destructive"
      });
      return;
    }
    
    if (!devicesToCompare.some(item => 
      item.Brand === device.Brand && 
      item.Model === device.Model && 
      item.Storage === device.Storage && 
      item.Condition === device.Condition
    )) {
      setDevicesToCompare(prev => [...prev, device]);
      
      // Scroll to comparison section
      setTimeout(() => {
        comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
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
  
  // Sort options
  const sortOptions: SortOption[] = [
    { label: 'Price (Low to High)', value: 'Price', direction: 'asc' },
    { label: 'Price (High to Low)', value: 'Price', direction: 'desc' },
    { label: 'Brand', value: 'Brand', direction: 'asc' },
    { label: 'Model', value: 'Model', direction: 'asc' },
    { label: 'Storage', value: 'Storage', direction: 'asc' },
    { label: 'Condition', value: 'Condition', direction: 'asc' },
  ];
  
  // Hide swipe hint after timeout
  useEffect(() => {
    if (showSwipeHint) {
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <HeroSection 
        title="Phone Price List"
        subtitle="Browse our selection of quality devices at competitive prices"
        imageSrc="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1600&q=80"
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <CurrencyToggle
              currency={currency}
              setCurrency={setCurrency}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <SearchBar onSearch={setSearchTerm} placeholder="Search brand, model, storage..." />
            
            <div className="flex gap-2">
              <Link to="/faq">
                <Button variant="outline" size="sm">
                  FAQs
                </Button>
              </Link>
              <Link to="/reviews">
                <Button variant="outline" size="sm">
                  Reviews
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Onboarding Guide */}
        <OnboardingGuide
          steps={[
            {
              title: "Welcome to Price List",
              description: "Browse our devices and submit a purchase request",
              image: "https://i.imgur.com/esqdOS8.jpeg"
            },
            {
              title: "Select Device Filters",
              description: "Use the filters to find the device you're looking for",
              image: "https://i.imgur.com/P9kN1f4.jpeg"
            },
            {
              title: "View Device Details",
              description: "Browse the device list and select one to purchase",
              image: "https://i.imgur.com/e0bOeUx.jpeg"
            },
            {
              title: "Complete Purchase Request",
              description: "Fill out the form to submit your purchase request",
              image: "https://i.imgur.com/efLlGEv.jpeg"
            }
          ]}
        />
        
        {/* Featured Devices */}
        <div className="mb-8">
          <FeaturedDevices 
            devices={featuredDevices} 
            onSelectDevice={handleDeviceSelect} 
            currency={currency}
            exchangeRate={exchangeRate}
          />
        </div>
        
        {/* Device Condition Guide */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            className="w-full md:w-auto dark:text-white dark:border-gray-600"
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
          <Card className="p-4 dark:bg-gray-800 dark:text-white">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Find Your Device</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                <Select
                  value={selectedBrand}
                  onValueChange={(value) => {
                    setSelectedBrand(value);
                    setSelectedModel('');
                    setSelectedStorage('');
                    setSelectedCondition('');
                  }}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                <Select
                  value={selectedModel}
                  onValueChange={(value) => {
                    setSelectedModel(value);
                    setSelectedStorage('');
                    setSelectedCondition('');
                  }}
                  disabled={!selectedBrand}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Storage</label>
                <Select
                  value={selectedStorage}
                  onValueChange={(value) => {
                    setSelectedStorage(value);
                    setSelectedCondition('');
                  }}
                  disabled={!selectedModel}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                <Select
                  value={selectedCondition}
                  onValueChange={setSelectedCondition}
                  disabled={!selectedStorage}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder={selectedStorage ? "Select Condition" : "Select Storage First"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-conditions">All Conditions</SelectItem>
                    {sortedConditionOptions.map(condition => (
                      <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Recently Viewed Devices */}
        {recentlyViewed.length > 0 && (
          <div className="mb-8">
            <RecentlyViewedDevices 
              devices={recentlyViewed}
              onSelectDevice={handleDeviceSelect}
              onCompareDevice={handleAddToComparison}
              currency={currency}
              exchangeRate={exchangeRate}
            />
          </div>
        )}
        
        {/* Device Comparison */}
        {devicesToCompare.length > 0 && (
          <div className="mb-8" ref={comparisonRef}>
            <DeviceComparison 
              devices={devicesToCompare}
              onRemoveDevice={(device) => {
                setDevicesToCompare(prev => prev.filter(d => 
                  !(d.Brand === device.Brand && 
                    d.Model === device.Model && 
                    d.Storage === device.Storage && 
                    d.Condition === device.Condition)
                ));
              }}
              currency={currency}
              exchangeRate={exchangeRate}
            />
          </div>
        )}
        
        {/* Results */}
        <div ref={resultsRef}>
          {loading ? (
            <p className="text-center py-8 dark:text-white">Loading devices...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-8">Error: {error}</p>
          ) : sortedDevices.length === 0 ? (
            <p className="text-center py-8 dark:text-white">No devices found. Please adjust your filters.</p>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto" ref={tableRef}>
              <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                <div>
                  <span className="text-sm font-medium dark:text-white">
                    {sortedDevices.length} {sortedDevices.length === 1 ? 'device' : 'devices'} found
                  </span>
                </div>
                <SortDropdown 
                  options={sortOptions}
                  onSort={setSortOption}
                  activeOption={sortOption}
                />
              </div>
              
              {/* Mobile swipe hint */}
              <div className={`md:hidden px-4 py-2 bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 flex items-center justify-center transition-opacity ${showSwipeHint ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Swipe left/right to see all columns</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Brand</TableHead>
                    <TableHead className="dark:text-gray-300">Model</TableHead>
                    <TableHead className="dark:text-gray-300">Storage</TableHead>
                    <TableHead className="dark:text-gray-300">Color</TableHead>
                    <TableHead className="dark:text-gray-300">Condition</TableHead>
                    <TableHead className="dark:text-gray-300">Price</TableHead>
                    <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDevices.map((device, index) => (
                    <TableRow key={index} className="dark:border-gray-700">
                      <TableCell className="dark:text-white">{device.Brand}</TableCell>
                      <TableCell className="dark:text-white">{device.Model}</TableCell>
                      <TableCell className="dark:text-white">{device.Storage}</TableCell>
                      <TableCell className="dark:text-white">{device.Color}</TableCell>
                      <TableCell className="dark:text-white">{device.Condition}</TableCell>
                      <TableCell className="font-bold text-[#d81570] dark:text-[#ff7eb6]">{formatPrice(device.Price)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToComparison(device)}
                          disabled={devicesToCompare.some(d => 
                            d.Brand === device.Brand && 
                            d.Model === device.Model && 
                            d.Storage === device.Storage && 
                            d.Condition === device.Condition
                          )}
                          className="text-xs dark:text-white dark:border-gray-600"
                        >
                          Compare
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-[#d81570] hover:bg-[#e83a8e] text-white text-xs"
                          onClick={() => handleDeviceSelect(device)}
                        >
                          Select <ChevronRight className="ml-1 h-3 w-3" />
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
      
      {/* ScrollToTop Component */}
      <ScrollToTop />
    </div>
  );
};

export default PriceList;
