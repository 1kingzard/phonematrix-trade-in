
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
import { ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SortDropdown, { SortOption } from '../components/SortDropdown';
import Testimonials from '../components/Testimonials';
import FAQSection from '../components/FAQSection';
import DeviceComparison from '../components/DeviceComparison';
import RecentlyViewedDevices from '../components/RecentlyViewedDevices';
import FeaturedDevices from '../components/FeaturedDevices';
import ThemeToggle from '../components/ThemeToggle';
import QuickFilters from '../components/QuickFilters';
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
  
  // Quick filter state
  const [quickBrandFilter, setQuickBrandFilter] = useState<string | null>(null);
  
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
  
  // Filter devices based on selections, search term, and quick filters
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
    
    // Apply quick brand filter
    const quickFilter = !quickBrandFilter || device.Brand === quickBrandFilter;
    
    return standardFilters && searchFilter && quickFilter;
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

  // Get featured devices (5 most expensive devices)
  const featuredDevices = [...devices]
    .sort((a, b) => b.Price - a.Price)
    .slice(0, 3);
  
  // Selected device for purchase
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  
  // Refs for scrolling
  const filtersRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const purchaseFormRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  
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
  
  // Testimonials data
  const testimonials = [
    {
      id: 1,
      author: "Sarah Johnson",
      text: "The trade-in process was so smooth! Got a great price for my old iPhone and the upgrade was hassle-free.",
      rating: 5,
    },
    {
      id: 2,
      author: "Michael Chen",
      text: "I was skeptical at first, but the pricing was fair and the customer service was excellent.",
      rating: 4,
    },
    {
      id: 3,
      author: "Aisha Patel",
      text: "Compared prices everywhere, and Phone Matrix offered the best trade-in value by far. Highly recommend!",
      rating: 5,
    }
  ];
  
  // FAQ data
  const faqs = [
    {
      question: "How does the trade-in process work?",
      answer: "Our trade-in process is simple: Select your current device, choose a device to upgrade to (optional), submit your trade-in request, and our team will contact you to arrange inspection and payment."
    },
    {
      question: "What condition should my device be in?",
      answer: "We accept devices in various conditions from mint to poor. The better the condition, the higher the trade-in value. Devices should be functional unless specified otherwise."
    },
    {
      question: "How long does the trade-in process take?",
      answer: "Once you submit your request, our team will contact you within 24-48 hours. The entire process typically takes 3-5 business days from inspection to payment."
    },
    {
      question: "Can I trade in multiple devices at once?",
      answer: "Yes, you can trade in multiple devices. Please submit separate trade-in requests for each device."
    },
    {
      question: "What payment methods do you offer?",
      answer: "We offer payment via bank transfer, cash, or store credit. Store credit offers an additional 10% bonus on your trade-in value."
    }
  ];
  
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
          
          <SearchBar onSearch={setSearchTerm} placeholder="Search brand, model, storage..." />
        </div>
        
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
            className="w-full md:w-auto"
            onClick={() => setShowConditionImages(!showConditionImages)}
          >
            {showConditionImages ? 'Hide' : 'Show'} Device Condition Guide
          </Button>
          <div className="mt-4">
            <DeviceConditionImages isVisible={showConditionImages} />
          </div>
        </div>
        
        {/* Quick Brand Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2 text-gray-700">Quick Brand Filter:</h3>
          <QuickFilters 
            filters={brands}
            activeFilter={quickBrandFilter}
            onFilterChange={setQuickBrandFilter}
            type="brand"
          />
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
                    if (quickBrandFilter && value !== quickBrandFilter) {
                      setQuickBrandFilter(null);
                    }
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
            <p className="text-center py-8">Loading devices...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-8">Error: {error}</p>
          ) : sortedDevices.length === 0 ? (
            <p className="text-center py-8">No devices found. Please adjust your filters.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto dark:bg-gray-800">
              <div className="p-4 flex justify-between items-center border-b">
                <div>
                  <span className="text-sm font-medium">
                    {sortedDevices.length} {sortedDevices.length === 1 ? 'device' : 'devices'} found
                  </span>
                </div>
                <SortDropdown 
                  options={sortOptions}
                  onSort={setSortOption}
                  activeOption={sortOption}
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDevices.map((device, index) => (
                    <TableRow key={index} className="dark:border-gray-700">
                      <TableCell>{device.Brand}</TableCell>
                      <TableCell>{device.Model}</TableCell>
                      <TableCell>{device.Storage}</TableCell>
                      <TableCell>{device.Color}</TableCell>
                      <TableCell>{device.Condition}</TableCell>
                      <TableCell className="font-bold">{formatPrice(device.Price)}</TableCell>
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
                          className="text-xs"
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
        
        {/* Testimonials Section */}
        <div className="mt-16">
          <Testimonials testimonials={testimonials} />
        </div>
        
        {/* FAQ Section */}
        <div className="mt-8">
          <FAQSection faqs={faqs} />
        </div>
      </main>
      
      {/* ScrollToTop Component */}
      <ScrollToTop />
    </div>
  );
};

export default PriceList;
