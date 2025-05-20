import React, { useState, useEffect, useRef } from 'react';
import { 
  useDeviceData, 
  DeviceData, 
  calculatePriceDifference, 
  calculateShippingCost,
  useExchangeRate,
  getUniqueValues
} from '../services/deviceDataService';
import CurrencyToggle from '../components/CurrencyToggle';
import DeviceFilters, { FilterOptions } from '../components/DeviceFilters';
import DeviceCard from '../components/DeviceCard';
import DeductionCalculator from '../components/DeductionCalculator';
import EmailForm from '../components/EmailForm';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import OnboardingGuide from '../components/OnboardingGuide';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Package, Smartphone, RefreshCcw, AlertTriangle } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SortDropdown, { SortOption } from '../components/SortDropdown';
import Testimonials from '../components/Testimonials';
import FAQSection from '../components/FAQSection';
import DeviceComparison from '../components/DeviceComparison';
import RecentlyViewedDevices from '../components/RecentlyViewedDevices';
import FeaturedDevices from '../components/FeaturedDevices';
import ThemeToggle from '../components/ThemeToggle';
import QuickFilters from '../components/QuickFilters';
import useLocalStorage from '../hooks/useLocalStorage';
import ScrollToTop from '../components/ScrollToTop'; // Fixed: Added the import for ScrollToTop

// Define currency type to avoid comparison errors
type CurrencyType = 'USD' | 'JMD';

const Index = () => {
  // Data state
  const { devices, loading, error } = useDeviceData();
  const { exchangeRate, loading: loadingRate } = useExchangeRate();
  const [filteredDevices, setFilteredDevices] = useState<DeviceData[]>([]);
  
  // UI state
  const [currency, setCurrency] = useState<CurrencyType>('JMD'); // Default to JMD
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [upgradeDevice, setUpgradeDevice] = useState<DeviceData | null>(null);
  const [finalTradeValue, setFinalTradeValue] = useState<number>(0);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showUpgradeSelection, setShowUpgradeSelection] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Search and sort state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption | undefined>(undefined);
  
  // Quick filter state
  const [quickBrandFilter, setQuickBrandFilter] = useState<string | null>(null);
  
  // Comparison state
  const [devicesToCompare, setDevicesToCompare] = useState<DeviceData[]>([]);
  
  // Recently viewed devices
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<DeviceData[]>('recentlyViewedDevicesTrade', []);
  
  // Refs for scrolling
  const upgradeDeviceRef = useRef<HTMLDivElement>(null);
  const emailFormRef = useRef<HTMLDivElement>(null);
  const selectedDeviceDetailsRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  
  // Get unique brands for quick filters
  const brands = getUniqueValues(devices, 'Brand');
  
  // Check if onboarding was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('onboardingDismissed') === 'true';
    setShowOnboarding(!dismissed);
  }, []);
  
  // Apply filters to device data
  const handleFilterChange = (filters: FilterOptions) => {
    let results = devices;
    
    if (filters.os && filters.os !== 'all-os') {
      results = results.filter(device => device.OS === filters.os);
    }
    
    if (filters.brand && filters.brand !== 'all-brands') {
      results = results.filter(device => device.Brand === filters.brand);
    }
    
    if (filters.model && filters.model !== 'all-models') {
      results = results.filter(device => device.Model === filters.model);
    }
    
    if (filters.storage && filters.storage !== 'all-storage') {
      results = results.filter(device => device.Storage === filters.storage);
    }
    
    if (filters.condition && filters.condition !== 'all-conditions') {
      results = results.filter(device => device.Condition === filters.condition);
    }
    
    // Apply search term filter
    if (searchTerm) {
      results = results.filter(device => 
        device.Brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.Model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.Storage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.Color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.Condition.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply quick brand filter
    if (quickBrandFilter) {
      results = results.filter(device => device.Brand === quickBrandFilter);
    }
    
    // Apply sorting
    if (sortOption) {
      results = [...results].sort((a, b) => {
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
    
    setFilteredDevices(results);
  };
  
  // Reset selection when filters change
  useEffect(() => {
    if (!showUpgradeSelection) {
      setSelectedDevice(null);
    }
    setUpgradeDevice(null);
    setShowEmailForm(false);
  }, [filteredDevices, showUpgradeSelection]);
  
  // Initialize filtered devices
  useEffect(() => {
    if (devices.length > 0) {
      setFilteredDevices(devices);
    }
  }, [devices]);
  
  // Handle device selection
  const handleDeviceSelect = (device: DeviceData) => {
    if (showUpgradeSelection) {
      setUpgradeDevice(device);
      // Scroll to selected device details section when upgrade device is selected
      setTimeout(() => {
        if (emailFormRef.current) {
          emailFormRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      setSelectedDevice(device);
      setFinalTradeValue(device.Price);
      
      // Add to recently viewed
      if (!recentlyViewed.some(item => 
        item.Brand === device.Brand && 
        item.Model === device.Model && 
        item.Storage === device.Storage && 
        item.Condition === device.Condition
      )) {
        setRecentlyViewed(prev => [device, ...prev.slice(0, 4)]);
      }
      
      // Scroll to selected device details section
      setTimeout(() => {
        if (selectedDeviceDetailsRef.current) {
          selectedDeviceDetailsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    setShowEmailForm(false);
  };
  
  // Handle adding device to comparison
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
        if (comparisonRef.current) {
          comparisonRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };
  
  // Handle deduction calculator value change
  const handleTradeValueChange = (value: number) => {
    setFinalTradeValue(value);
  };
  
  // Handle proceed to upgrade selection
  const handleProceedToUpgrade = () => {
    setShowUpgradeSelection(true);
    // Scroll to upgrade device selection
    setTimeout(() => {
      if (upgradeDeviceRef.current) {
        upgradeDeviceRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  // Handle back from upgrade selection
  const handleBackFromUpgrade = () => {
    setShowUpgradeSelection(false);
    setUpgradeDevice(null);
  };
  
  // Handle proceed to email form
  const handleProceedToEmail = () => {
    setShowEmailForm(true);
    // Scroll to email form
    setTimeout(() => {
      if (emailFormRef.current) {
        emailFormRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  // Handle email submission success
  const handleEmailSuccess = () => {
    toast({
      title: "Trade-in Request Sent",
      description: "Your trade-in request has been sent successfully. We'll contact you shortly.",
    });
    
    // Reset selection for a new quote
    setSelectedDevice(null);
    setUpgradeDevice(null);
    setShowUpgradeSelection(false);
    setShowEmailForm(false);
  };
  
  // Handle going back from email form
  const handleBackFromEmail = () => {
    setShowEmailForm(false);
  };
  
  // Calculate price difference and additional costs
  const priceDifference = calculatePriceDifference(selectedDevice, upgradeDevice, finalTradeValue);
  
  // Calculate shipping cost only for the upgrade device in JMD
  const shippingCost = currency === 'JMD' && upgradeDevice 
    ? calculateShippingCost(upgradeDevice.Price) 
    : 0;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(currency === 'USD' ? value : value * exchangeRate);
  };
  
  // Get featured devices (5 most expensive devices)
  const featuredDevices = [...devices]
    .sort((a, b) => b.Price - a.Price)
    .slice(0, 3);
    
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
  
  // Render content based on loading/error state
  if (loading || loadingRate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="loading-spinner"></div>
          <div className="text-2xl font-bold dark:text-white">Loading Device Data...</div>
          <div className="text-gray-500 dark:text-gray-400">Please wait while we fetch the latest trade-in values.</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-red-500">Error Loading Data</div>
          <div className="text-gray-700 dark:text-gray-300">{error}</div>
          <Button onClick={() => window.location.reload()} className="bg-[#d81570] hover:bg-[#e83a8e]">
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-10 dark:bg-gray-900">
      {/* Onboarding guide */}
      {showOnboarding && <OnboardingGuide steps={[
        {
          title: "Welcome to Trade-In Calculator",
          description: "Find the best value for your device trade-in",
          image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80"
        },
        {
          title: "Select Your Current Device",
          description: "Choose the device you want to trade in",
          image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=500&q=80"
        },
        {
          title: "Select Your Upgrade",
          description: "Browse available devices for your upgrade",
          image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=500&q=80"
        },
        {
          title: "Complete Your Trade-in",
          description: "Submit your request and we'll contact you",
          image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80"
        }
      ]} />}
      
      {/* Header section */}
      <Header />
      
      {/* Hero Section */}
      <HeroSection 
        title="Device Trade-in Value Calculator"
        subtitle="Get the best value when you upgrade your device"
        imageSrc="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1600&q=80"
      />
      
      <main className="container mt-8">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <CurrencyToggle currency={currency} setCurrency={setCurrency} />
          </div>
          
          <SearchBar onSearch={setSearchTerm} placeholder="Search brand, model, storage..." />
        </div>
        
        {/* Featured Devices */}
        <div className="mb-8">
          <FeaturedDevices 
            devices={featuredDevices} 
            onSelectDevice={handleDeviceSelect} 
            currency={currency}
            exchangeRate={exchangeRate}
          />
        </div>
        
        {/* How to use guide */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700">
          <h2 className="font-semibold text-lg mb-3 flex items-center text-[#d81570]">
            <AlertTriangle className="h-5 w-5 mr-2" /> 
            How to Use This Tool
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
              <div className="rounded-full bg-[#fce4f1] p-3 mb-3 dark:bg-[#d81570]/20">
                <Smartphone className="h-6 w-6 text-[#d81570]" />
              </div>
              <h3 className="font-medium mb-1">1. Select Your Device</h3>
              <p className="text-sm text-gray-500 dark:text-gray-300">Choose your current device from the available options</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
              <div className="rounded-full bg-[#fce4f1] p-3 mb-3 dark:bg-[#d81570]/20">
                <RefreshCcw className="h-6 w-6 text-[#d81570]" />
              </div>
              <h3 className="font-medium mb-1">2. Choose Your Upgrade</h3>
              <p className="text-sm text-gray-500 dark:text-gray-300">Select a new device to upgrade to</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
              <div className="rounded-full bg-[#fce4f1] p-3 mb-3 dark:bg-[#d81570]/20">
                <Package className="h-6 w-6 text-[#d81570]" />
              </div>
              <h3 className="font-medium mb-1">3. Complete Your Request</h3>
              <p className="text-sm text-gray-500 dark:text-gray-300">Submit the form and we'll contact you about your trade-in</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center dark:text-gray-400">
            Note: For devices in JMD, a 30% shipping cost applies for upgrades coming to Jamaica
          </p>
        </div>
        
        {/* Quick Brand Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quick Brand Filter:</h3>
          <QuickFilters 
            filters={brands}
            activeFilter={quickBrandFilter}
            onFilterChange={setQuickBrandFilter}
            type="brand"
          />
        </div>
        
        {/* Email form view */}
        {selectedDevice && showEmailForm ? (
          <div className="space-y-6" ref={emailFormRef}>
            <Button 
              variant="outline" 
              onClick={handleBackFromEmail}
              className="flex items-center gap-1 text-[#d81570]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Calculator
            </Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DeductionCalculator 
                basePrice={selectedDevice.Price} 
                currency={currency}
                onValueChange={handleTradeValueChange}
              />
              <EmailForm 
                selectedDevice={selectedDevice}
                upgradeDevice={upgradeDevice}
                finalTradeValue={finalTradeValue}
                priceDifference={priceDifference}
                shippingCost={shippingCost}
                currency={currency}
                exchangeRate={exchangeRate}
                onSubmitSuccess={handleEmailSuccess}
              />
            </div>
          </div>
        ) : showUpgradeSelection && selectedDevice ? (
          /* Upgrade device selection view */
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={handleBackFromUpgrade}
              className="flex items-center gap-1 text-[#d81570]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Trade-in Selection
            </Button>
            
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6 dark:bg-gray-800 dark:border dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-[#d81570]">Selected Trade-in Device</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-medium">{selectedDevice.Brand} {selectedDevice.Model}</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedDevice.Storage} • {selectedDevice.Color} • {selectedDevice.Condition}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-gray-600 dark:text-gray-300">Trade-in Value:</p>
                  <p className="text-xl font-bold text-[#d81570]">{formatCurrency(finalTradeValue)}</p>
                </div>
              </div>
            </div>
            
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
            
            <h2 className="text-xl font-semibold mb-4 text-[#d81570]" ref={upgradeDeviceRef}>Select Your Upgrade Device</h2>
            
            {/* Sort and search controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <SortDropdown 
                options={sortOptions}
                onSort={setSortOption}
                activeOption={sortOption}
              />
              
              <SearchBar onSearch={setSearchTerm} placeholder="Search devices..." />
            </div>
            
            {/* Filters for upgrade device */}
            <DeviceFilters devices={devices} onFilterChange={handleFilterChange} />
            
            {/* Upgrade device selection */}
            <div className="mt-8">
              {filteredDevices.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center dark:bg-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">No devices match your selected filters. Please try different criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDevices.map((device, index) => (
                    <DeviceCard
                      key={`${device.Model}-${device.Storage}-${device.Condition}-${index}`}
                      device={device}
                      currency={currency}
                      exchangeRate={exchangeRate}
                      onClick={() => handleDeviceSelect(device)}
                      selected={upgradeDevice === device}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected upgrade device details */}
            {upgradeDevice && (
              <div className="mt-8 bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700" ref={emailFormRef}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#d81570]">Your Trade-in</h3>
                    <p>{selectedDevice.Brand} {selectedDevice.Model}</p>
                    <p className="text-gray-600 text-sm dark:text-gray-300">
                      {selectedDevice.Storage} • {selectedDevice.Condition}
                    </p>
                    <p className="font-bold mt-2 text-[#d81570]">{formatCurrency(finalTradeValue)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#d81570]">Your Upgrade</h3>
                    <p>{upgradeDevice.Brand} {upgradeDevice.Model}</p>
                    <p className="text-gray-600 text-sm dark:text-gray-300">
                      {upgradeDevice.Storage} • {upgradeDevice.Condition}
                    </p>
                    <p className="font-bold mt-2 text-[#d81570]">{formatCurrency(upgradeDevice.Price)}</p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Price Difference:</span>
                    <span className="font-medium">{formatCurrency(priceDifference)}</span>
                  </div>
                  
                  {currency === 'JMD' && (
                    <div className="flex justify-between text-amber-700">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Shipping Cost (30% of upgrade):
                      </span>
                      <span className="font-medium">{formatCurrency(shippingCost)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg pt-3">
                    <span>Total to Pay:</span>
                    <span className="text-[#d81570]">{formatCurrency(priceDifference + shippingCost)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6 bg-[#d81570] hover:bg-[#e83a8e]" 
                  onClick={handleProceedToEmail}
                >
                  Complete Trade-in Request
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
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
            
            {/* Sort and search controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <SortDropdown 
                options={sortOptions}
                onSort={setSortOption}
                activeOption={sortOption}
              />
              
              <SearchBar onSearch={setSearchTerm} placeholder="Search devices..." />
            </div>
            
            {/* Filters section */}
            <DeviceFilters devices={devices} onFilterChange={handleFilterChange} />
            
            {/* Results section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-[#d81570]">Select Your Current Device for Trade-in</h2>
              
              {filteredDevices.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center dark:bg-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">No devices match your selected filters. Please try different criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDevices.map((device, index) => (
                    <DeviceCard
                      key={`${device.Model}-${device.Storage}-${device.Condition}-${index}`}
                      device={device}
                      currency={currency}
                      exchangeRate={exchangeRate}
                      onClick={() => handleDeviceSelect(device)}
                      selected={selectedDevice === device}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected device details */}
            {selectedDevice && (
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8" ref={selectedDeviceDetailsRef}>
                <DeductionCalculator 
                  basePrice={selectedDevice.Price} 
                  currency={currency}
                  onValueChange={handleTradeValueChange}
                />
                
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6 dark:bg-gray-800 dark:border dark:border-gray-700">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-[#d81570]">Selected Device</h3>
                    <p className="text-lg">{selectedDevice.Brand} {selectedDevice.Model}</p>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedDevice.Storage} &bull; {selectedDevice.Color} &bull; {selectedDevice.Condition}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Final Trade-in Value:</p>
                      <p className="text-2xl font-bold text-[#d81570]">
                        {formatCurrency(finalTradeValue)}
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full bg-[#d81570] hover:bg-[#e83a8e]" 
                      onClick={handleProceedToUpgrade}
                    >
                      Select Upgrade Device
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Testimonials Section */}
      <div className="mt-16">
        <Testimonials testimonials={testimonials} />
      </div>
      
      {/* FAQ Section */}
      <div className="container mx-auto px-4 mt-8">
        <FAQSection faqs={faqs} />
      </div>
      
      {/* Footer */}
      <footer className="mt-16 py-6 bg-gray-100 border-t dark:bg-gray-800 dark:border-gray-700">
        <div className="container text-center text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Phone Matrix Trade-in Calculator. All rights reserved.
        </div>
      </footer>
      
      {/* ScrollToTop Component */}
      <ScrollToTop />
    </div>
  );
};

export default Index;
