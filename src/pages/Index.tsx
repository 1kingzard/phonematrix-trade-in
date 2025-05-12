
import React, { useState, useEffect } from 'react';
import { useDeviceData, DeviceData } from '../services/deviceDataService';
import CurrencyToggle from '../components/CurrencyToggle';
import DeviceFilters, { FilterOptions } from '../components/DeviceFilters';
import DeviceCard from '../components/DeviceCard';
import DeductionCalculator from '../components/DeductionCalculator';
import EmailForm from '../components/EmailForm';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';

const Index = () => {
  // Data state
  const { devices, loading, error } = useDeviceData();
  const [filteredDevices, setFilteredDevices] = useState<DeviceData[]>([]);
  
  // UI state
  const [currency, setCurrency] = useState<string>('JMD'); // Default to JMD
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [finalTradeValue, setFinalTradeValue] = useState<number>(0);
  const [showEmailForm, setShowEmailForm] = useState(false);
  
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
    setSelectedDevice(null);
    setShowEmailForm(false);
  }, [filteredDevices]);
  
  // Initialize filtered devices
  useEffect(() => {
    if (devices.length > 0) {
      setFilteredDevices(devices);
    }
  }, [devices]);
  
  // Handle device selection
  const handleDeviceSelect = (device: DeviceData) => {
    setSelectedDevice(device);
    setFinalTradeValue(device.Price);
    setShowEmailForm(false);
  };
  
  // Handle deduction calculator value change
  const handleTradeValueChange = (value: number) => {
    setFinalTradeValue(value);
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
    setShowEmailForm(false);
  };
  
  // Handle going back from email form
  const handleBackFromEmail = () => {
    setShowEmailForm(false);
  };
  
  // Render content based on loading/error state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold">Loading Device Data...</div>
          <div className="text-gray-500">Please wait while we fetch the latest trade-in values.</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-red-500">Error Loading Data</div>
          <div className="text-gray-700">{error}</div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header section */}
      <header className="bg-white shadow-sm">
        <div className="container py-6">
          <h1 className="text-2xl md:text-3xl font-bold">Device Trade-in Value Calculator</h1>
          <p className="text-gray-600 mt-2">
            Compare trade-in values for your devices and get an instant quote.
          </p>
        </div>
      </header>
      
      <main className="container mt-8">
        {/* Currency toggle */}
        <div className="flex justify-end mb-4">
          <CurrencyToggle currency={currency} setCurrency={setCurrency} />
        </div>
        
        {/* Email form view */}
        {selectedDevice && showEmailForm ? (
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={handleBackFromEmail}
              className="flex items-center gap-1"
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
                finalTradeValue={finalTradeValue}
                currency={currency}
                onSubmitSuccess={handleEmailSuccess}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Filters section */}
            <DeviceFilters devices={devices} onFilterChange={handleFilterChange} />
            
            {/* Results section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Available Trade-in Options</h2>
              
              {filteredDevices.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <p className="text-gray-500">No devices match your selected filters. Please try different criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDevices.map((device, index) => (
                    <DeviceCard
                      key={`${device.Model}-${device.Storage}-${device.Condition}-${index}`}
                      device={device}
                      currency={currency}
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
                
                <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Selected Device</h3>
                    <p className="text-lg">{selectedDevice.Brand} {selectedDevice.Model}</p>
                    <p className="text-gray-600">
                      {selectedDevice.Storage} &bull; {selectedDevice.Color} &bull; {selectedDevice.Condition}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600">Final Trade-in Value:</p>
                      <p className="text-2xl font-bold text-brand-blue">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: currency,
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(
                          currency === 'USD' 
                            ? finalTradeValue 
                            : finalTradeValue * 154
                        )}
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full bg-brand-orange hover:bg-brand-orange/90" 
                      onClick={handleProceedToEmail}
                    >
                      Request Trade-in Quote
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-16 py-6 bg-gray-100 border-t">
        <div className="container text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Phone Matrix Trade-in Calculator. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
