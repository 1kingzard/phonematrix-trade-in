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
import HeroSection from '../components/HeroSection';
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
          <div className="text-2xl font-medium text-gray-900">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="text-2xl font-semibold text-red-500">Error Loading Data</div>
          <div className="text-gray-700">{error}</div>
          <Button onClick={() => window.location.reload()} className="bg-black hover:bg-gray-800">
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
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
      
      {/* Main Hero Section */}
      <HeroSection 
        title="The future of device trading."
        subtitle="Get the most value for your device with our transparent pricing and seamless trade-in process."
        imageSrc="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1600&q=80"
        ctaText="Get Started"
        onCtaClick={handleScrollToTradeIn}
        height="xl"
      />
      
      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold text-black mb-2">10,000+</div>
              <div className="text-gray-600 text-lg">Devices Traded</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-black mb-2">4.9★</div>
              <div className="text-gray-600 text-lg">Customer Rating</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-black mb-2">24h</div>
              <div className="text-gray-600 text-lg">Quick Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-black mb-6">Why choose PhoneMatrix?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of device trading with our innovative platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure & Trusted",
                description: "Enterprise-level security for your devices and data"
              },
              {
                icon: Users,
                title: "Expert Support",
                description: "Our team guides you through every step"
              },
              {
                icon: CheckCircle,
                title: "Quality Guarantee",
                description: "30-day warranty on all devices"
              },
              {
                icon: Star,
                title: "Best Value",
                description: "Competitive pricing with transparent rates"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-black">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-32 bg-black text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-8">
                Trade in your device.
                <br />
                Upgrade your life.
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                From smartphones to tablets, get instant quotes and seamless upgrades. 
                Our AI-powered valuation ensures you get the best price for your device.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg"
                onClick={handleScrollToTradeIn}
              >
                Start Trading
              </Button>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80"
                alt="Device Showcase"
                className="w-full rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-black mb-6">How it works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and transparent</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Select Device",
                description: "Choose your current device and get an instant quote",
                image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80"
              },
              {
                step: "2", 
                title: "Choose Upgrade",
                description: "Browse and select your next device (optional)",
                image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=400&q=80"
              },
              {
                step: "3",
                title: "Complete Trade",
                description: "Submit your request and we'll handle everything",
                image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&q=80"
              }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <img 
                    src={step.image}
                    alt={step.title}
                    className="w-full h-64 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-black">{step.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trade-in Calculator Section */}
      {showTradeInSection && (
        <section className="py-32 bg-white" ref={tradeInSectionRef}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-black mb-6">Start your trade-in</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Select your current device to get an instant quote
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
              <h3 className="text-lg font-medium mb-4 text-gray-900">Filter by brand:</h3>
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
                  <p className="text-gray-500 text-lg">No devices match your selected filters.</p>
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
                <Card className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <DeductionCalculator 
                      basePrice={selectedDevice.Price} 
                      currency={currency}
                      onValueChange={setFinalTradeValue}
                    />
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-black mb-2">Selected Device</h3>
                        <p className="text-xl text-gray-900">{selectedDevice.Brand} {selectedDevice.Model}</p>
                        <p className="text-gray-600">
                          {selectedDevice.Storage} • {selectedDevice.Color} • {selectedDevice.Condition}
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <p className="text-gray-600 mb-2">Trade-in Value:</p>
                        <p className="text-3xl font-bold text-black mb-6">
                          {formatCurrency(finalTradeValue)}
                        </p>
                        
                        <Button 
                          size="lg"
                          className="w-full bg-black hover:bg-gray-800 text-white py-4 text-lg" 
                          onClick={() => setShowUpgradeSelection(true)}
                        >
                          Continue to Upgrade
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

      {/* Testimonials */}
      <section className="py-32 bg-gray-50">
        <Testimonials testimonials={testimonials} />
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-8">Ready to trade?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust PhoneMatrix
          </p>
          <Button 
            size="lg" 
            className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg"
            onClick={handleScrollToTradeIn}
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} PhoneMatrix. All rights reserved.
          </p>
        </div>
      </footer>
      
      <ScrollToTop />
    </div>
  );
};

export default Index;
