
import React from 'react';
import { DeviceCard } from './DeviceCard';

interface Device {
  id: string;
  brand: string;
  model: string;
  condition: string;
  price: number;
  image?: string;
}

interface DeviceGridProps {
  devices: Device[];
  currency: string;
  onDeviceSelect: (device: Device) => void;
  isLoading?: boolean;
}

export const DeviceGrid: React.FC<DeviceGridProps> = React.memo(({
  devices,
  currency,
  onDeviceSelect,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
            <div className="bg-gray-200 h-4 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No devices found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {devices.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          currency={currency}
          onClick={() => onDeviceSelect(device)}
        />
      ))}
    </div>
  );
});

DeviceGrid.displayName = 'DeviceGrid';
