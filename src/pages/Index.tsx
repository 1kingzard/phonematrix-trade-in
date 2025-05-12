
import React, { useState, useEffect } from 'react';
import { 
  useDeviceData, 
  DeviceData, 
  calculatePriceDifference, 
  calculateShippingCost,
  useExchangeRate
} from '../services/deviceDataService';
import CurrencyToggle from '../components/CurrencyToggle';
import DeviceFilters, { FilterOptions } from '../components/DeviceFilters';
import DeviceCard from '../components/DeviceCard';
import DeductionCalculator from '../components/DeductionCalculator';
import EmailForm from '../components/EmailForm';
import Header from '../components/Header';
import OnboardingGuide from '../components/OnboardingGuide';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Package, Smartphone, RefreshCcw, AlertTriangle } from 'lucide-react';

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
    } else {
      setSelectedDevice(device);
      setFinalTradeValue(device.Price);
    }
    setShowEmailForm(false);
  };
  
  // Handle deduction calculator value change
  const handleTradeValueChange = (value: number) => {
    setFinalTradeValue(value);
  };
  
  // Handle proceed to upgrade selection
  const handleProceedToUpgrade = () => {
    setShowUpgradeSelection(true);
  };
  
  // Handle back from upgrade selection
  const handleBackFromUpgrade = () => {
    setShowUpgradeSelection(false);
    setUpgradeDevice(null);
  };
  
  // Handle proceed to email form
  const handleProceedToEmail = () => {
    setShowEmailForm(true);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-10">
      {/* Onboarding guide */}
      {showOnboarding && <OnboardingGuide />}
      
      {/* Header section */}
      <Header />
      
      <div className="bg-gradient-to-r from-[#fef2f8] to-[#fce4f1] dark:from-[#2a0a1e] dark:to-[#471934] py-8">
        <div className="container">
          <h1 className="text-2xl md:text-3xl font-bold text-[#d81570] dark:text-[#ff7eb6]">
            Device Trade-in Value Calculator
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Compare trade-in values for your devices and get an instant quote.
          </p>
        </div>
      </div>
      
      <main className="container mt-8">
        {/* Currency toggle */}
        <div className="flex justify-end mb-4">
          <CurrencyToggle currency={currency} setCurrency={setCurrency} />
        </div>
        
        {/* How to use guide */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 className="font-semibold text-lg mb-3 flex items-center text-[#d81570] dark:text-[#ff7eb6]">
            <AlertTriangle className="h-5 w-5 mr-2" /> 
            How to Use This Tool
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="rounded-full bg-[#fce4f1] dark:bg-[#471934] p-3 mb-3">
                <Smartphone className="h-6 w-6 text-[#d81570] dark:text-[#ff7eb6]" />
              </div>
              <h3 className="font-medium mb-1">1. Select Your Device</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose your current device from the available options</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="rounded-full bg-[#fce4f1] dark:bg-[#471934] p-3 mb-3">
                <RefreshCcw className="h-6 w-6 text-[#d81570] dark:text-[#ff7eb6]" />
              </div>
              <h3 className="font-medium mb-1">2. Choose Upgrade or Cash</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Decide to trade for a new device or get cash value</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="rounded-full bg-[#fce4f1] dark:bg-[#471934] p-3 mb-3">
                <Package className="h-6 w-6 text-[#d81570] dark:text-[#ff7eb6]" />
              </div>
              <h3 className="font-medium mb-1">3. Complete Your Request</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Submit the form and we'll contact you about your trade-in</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            Note: For devices in JMD, a 30% shipping cost applies for upgrades coming to Jamaica
          </p>
        </div>
        
        {/* Email form view */}
        {selectedDevice && showEmailForm ? (
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={handleBackFromEmail}
              className="flex items-center gap-1 text-[#d81570] dark:text-[#ff7eb6] dark:border-gray-700"
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
              className="flex items-center gap-1 text-[#d81570] dark:text-[#ff7eb6] dark:border-gray-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Trade-in Selection
            </Button>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-xl font-semibold mb-4 text-[#d81570] dark:text-[#ff7eb6]">Selected Trade-in Device</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-medium dark:text-white">{selectedDevice.Brand} {selectedDevice.Model}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedDevice.Storage} • {selectedDevice.Color} • {selectedDevice.Condition}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-gray-600 dark:text-gray-400">Trade-in Value:</p>
                  <p className="text-xl font-bold text-[#d81570] dark:text-[#ff7eb6]">{formatCurrency(finalTradeValue)}</p>
                </div>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-4 text-[#d81570] dark:text-[#ff7eb6]">Select Your Upgrade Device</h2>
            
            {/* Filters for upgrade device */}
            <DeviceFilters devices={devices} onFilterChange={handleFilterChange} />
            
            {/* Upgrade device selection */}
            <div className="mt-8">
              {filteredDevices.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
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
              <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#d81570] dark:text-[#ff7eb6]">Your Trade-in</h3>
                    <p className="dark:text-white">{selectedDevice.Brand} {selectedDevice.Model}</p>
                    <p className="text-gray-600 text-sm dark:text-gray-400">
                      {selectedDevice.Storage} • {selectedDevice.Condition}
                    </p>
                    <p className="font-bold mt-2 text-[#d81570] dark:text-[#ff7eb6]">{formatCurrency(finalTradeValue)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[#d81570] dark:text-[#ff7eb6]">Your Upgrade</h3>
                    <p className="dark:text-white">{upgradeDevice.Brand} {upgradeDevice.Model}</p>
                    <p className="text-gray-600 text-sm dark:text-gray-400">
                      {upgradeDevice.Storage} • {upgradeDevice.Condition}
                    </p>
                    <p className="font-bold mt-2 text-[#d81570] dark:text-[#ff7eb6]">{formatCurrency(upgradeDevice.Price)}</p>
                  </div>
                </div>
                
                <Separator className="my-6 dark:bg-gray-700" />
                
                <div className="space-y-3">
                  <div className="flex justify-between dark:text-white">
                    <span>Price Difference:</span>
                    <span className="font-medium">{formatCurrency(priceDifference)}</span>
                  </div>
                  
                  {currency === 'JMD' && (
                    <div className="flex justify-between text-amber-700 dark:text-amber-500">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Shipping Cost (30% of upgrade):
                      </span>
                      <span className="font-medium">{formatCurrency(shippingCost)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg pt-3 dark:text-white">
                    <span>Total to Pay:</span>
                    <span className="text-[#d81570] dark:text-[#ff7eb6]">{formatCurrency(priceDifference + shippingCost)}</span>
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
            {/* Filters section */}
            <DeviceFilters devices={devices} onFilterChange={handleFilterChange} />
            
            {/* Results section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-[#d81570] dark:text-[#ff7eb6]">Select Your Current Device for Trade-in</h2>
              
              {filteredDevices.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
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
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DeductionCalculator 
                  basePrice={selectedDevice.Price} 
                  currency={currency}
                  onValueChange={handleTradeValueChange}
                />
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-[#d81570] dark:text-[#ff7eb6]">Selected Device</h3>
                    <p className="text-lg dark:text-white">{selectedDevice.Brand} {selectedDevice.Model}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedDevice.Storage} &bull; {selectedDevice.Color} &bull; {selectedDevice.Condition}
                    </p>
                  </div>
                  
                  <Separator className="dark:bg-gray-700" />
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Final Trade-in Value:</p>
                      <p className="text-2xl font-bold text-[#d81570] dark:text-[#ff7eb6]">
                        {formatCurrency(finalTradeValue)}
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full bg-[#d81570] hover:bg-[#e83a8e]" 
                      onClick={handleProceedToUpgrade}
                    >
                      Select Upgrade Device
                    </Button>
                    
                    <Button 
                      className="w-full border-[#d81570] text-[#d81570] hover:bg-[#fce4f1] dark:border-[#ff7eb6] dark:text-[#ff7eb6] dark:hover:bg-[#471934]" 
                      variant="outline"
                      onClick={handleProceedToEmail}
                    >
                      Request Trade-in Quote Only
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-16 py-6 bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700">
        <div className="container text-center text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Phone Matrix Trade-in Calculator. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
