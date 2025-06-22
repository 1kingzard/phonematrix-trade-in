import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
import { DeviceGrid } from '../components/DeviceGrid';
import DeductionCalculator from '../components/DeductionCalculator';
import EmailForm from '../components/EmailForm';
import Header from '../components/Header';
import OnboardingGuide from '../components/OnboardingGuide';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Package, Smartphone, RefreshCcw, AlertTriangle, Star, CheckCircle, Users, Shield } from 'lucide-react';
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
import ScrollToTop from '../components/ScrollToTop';

// Define currency type to avoid comparison errors
type CurrencyType = 'USD' | 'JMD';

const Index = () => {
  // Data state
  const { devices, loading, error } = useDeviceData();
  const { exchangeRate, loading: loadingRate } = useExchangeRate();
  const [filteredDevices, setFilteredDevices] = useState<DeviceData[]>([]);
  
  // UI state
  const [currency, setCurrency] = useState<CurrencyType>('JMD');
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [upgradeDevice, setUpgradeDevice] = useState<DeviceData | null>(null);
  const [finalTradeValue, setFinalTradeValue] = useState<number>(0);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showUpgradeSelection, setShowUpgradeSelection] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTradeInSection, setShowTradeInSection] = useState(false);
  
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
  const tradeInSectionRef = useRef<HTMLDivElement>(null);
  
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
  
  // Handle scroll to trade-in section
  const handleScrollToTradeIn = () => {
    setShowTradeInSection(true);
    setTimeout(() => {
      if (tradeInSectionRef.current) {
        tradeInSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto"></div>
          <div className="text-2xl font-medium text-white">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="text-2xl font-semibold text-red-400">Error Loading Data</div>
          <div className="text-gray-300">{error}</div>
          <Button onClick={() => window.location.reload()} className="bg-white text-black hover:bg-gray-200">
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
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
      
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Boost your <span className="text-yellow-400">PhoneMatrix</span><br />
                  game with <span className="text-yellow-400">Premium</span><br />
                  <span className="text-yellow-400">Trade Plans</span>
                </h1>
                
                <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
                  Get all the current and upcoming devices to speed up your 
                  workflow and publish in minutes. <span className="text-white font-medium">one payment</span>, lifetime updates.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-yellow-400 text-black hover:bg-yellow-300 px-8 py-4 text-lg font-medium rounded-full"
                  onClick={handleScrollToTradeIn}
                >
                  See Premium Plans
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-gray-600"></div>
                    ))}
                  </div>
                  <span>Save $194</span>
                </div>
              </div>
            </div>
            
            {/* Right content - Floating devices */}
            <div className="relative h-96 lg:h-[500px]">
              {/* Large device mockup */}
              <div className="absolute top-0 right-0 w-64 h-80 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 shadow-2xl transform rotate-12 hover:rotate-6 transition-transform duration-500">
                <div className="p-8 h-full flex flex-col justify-center items-center">
                  <div className="w-16 h-16 bg-yellow-400 rounded-2xl mb-4 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-1">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-black rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg mb-2">PhoneMatrix</div>
                    <div className="text-gray-400 text-sm">Premium Trade</div>
                  </div>
                </div>
              </div>
              
              {/* Small device mockup */}
              <div className="absolute bottom-8 left-8 w-48 h-60 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl border border-gray-600 shadow-xl transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                <div className="p-6 h-full flex flex-col justify-center items-center">
                  <div className="w-12 h-12 bg-yellow-400 rounded-xl mb-3 flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-1">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-black rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold mb-1">PhoneMatrix</div>
                    <div className="text-gray-400 text-xs">Trade Pro</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-32 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight">
            Get your premium, neatly<br />
            crafted <span className="text-yellow-400">PhoneMatrix</span> assets and<br />
            <span className="text-yellow-400">every next future release</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Lifetime Updates</h3>
              <p className="text-gray-400">Get all future device releases and updates with one payment</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Premium Support</h3>
              <p className="text-gray-400">Priority customer support and dedicated assistance</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Best Prices</h3>
              <p className="text-gray-400">Guaranteed highest trade-in values in the market</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trade-in Calculator Section */}
      {showTradeInSection && (
        <section className="py-32 bg-gray-900" ref={tradeInSectionRef}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">Start your premium trade</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Select your current device to get an instant premium quote
              </p>
            </div>

            {/* Top Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <CurrencyToggle currency={currency} setCurrency={setCurrency} />
              </div>
              <SearchBar onSearch={setSearchTerm} placeholder="Search brand, model, storage..." />
            </div>

            {/* Featured Devices */}
            {featuredDevices.length > 0 && (
              <div className="mb-12">
                <FeaturedDevices 
                  devices={featuredDevices} 
                  onSelectDevice={handleDeviceSelect} 
                  currency={currency}
                  exchangeRate={exchangeRate}
                />
              </div>
            )}

            {/* Quick Brand Filters */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-white">Filter by brand:</h3>
              <QuickFilters 
                filters={brands}
                activeFilter={quickBrandFilter}
                onFilterChange={setQuickBrandFilter}
                type="brand"
              />
            </div>

            {/* Sort and Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <SortDropdown 
                options={sortOptions}
                onSort={setSortOption}
                activeOption={sortOption}
              />
            </div>

            <DeviceFilters devices={devices} onFilterChange={handleFilterChange} />

            {/* Device Grid */}
            <div className="mt-12">
              {filteredDevices.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg">No devices match your selected filters.</p>
                </div>
              ) : (
                <DeviceGrid
                  devices={filteredDevices}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  onDeviceSelect={handleDeviceSelect}
                  isLoading={loading}
                />
              )}
            </div>

            {/* Selected device details */}
            {selectedDevice && (
              <div className="mt-16 max-w-4xl mx-auto" ref={selectedDeviceDetailsRef}>
                <Card className="p-8 bg-gray-800 border-gray-700">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <DeductionCalculator 
                      basePrice={selectedDevice.Price} 
                      currency={currency}
                      onValueChange={setFinalTradeValue}
                    />
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Selected Device</h3>
                        <p className="text-xl text-white">{selectedDevice.Brand} {selectedDevice.Model}</p>
                        <p className="text-gray-300">
                          {selectedDevice.Storage} • {selectedDevice.Color} • {selectedDevice.Condition}
                        </p>
                      </div>
                      
                      <Separator className="bg-gray-700" />
                      
                      <div>
                        <p className="text-gray-300 mb-2">Premium Trade-in Value:</p>
                        <p className="text-3xl font-bold text-yellow-400 mb-6">
                          {formatCurrency(finalTradeValue)}
                        </p>
                        
                        <Button 
                          size="lg"
                          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black py-4 text-lg font-medium" 
                          onClick={() => setShowUpgradeSelection(true)}
                        >
                          Continue to Premium Upgrade
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-32 bg-black">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-8">Ready for premium?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust PhoneMatrix Premium
          </p>
          <Button 
            size="lg" 
            className="bg-yellow-400 text-black hover:bg-yellow-300 px-8 py-4 text-lg font-medium rounded-full"
            onClick={handleScrollToTradeIn}
          >
            Get Premium Access
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} PhoneMatrix Premium. All rights reserved.
          </p>
        </div>
      </footer>
      
      <ScrollToTop />
    </div>
  );
};

export default Index;
