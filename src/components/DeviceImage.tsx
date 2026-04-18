import React from 'react';
import { Smartphone } from 'lucide-react';
import { useDeviceImage } from '@/services/deviceImageService';

interface DeviceImageProps {
  brand: string;
  model: string;
  className?: string;
  /** Aspect-ratio container class. Default: portrait 3:4 */
  aspectClass?: string;
}

const initials = (brand: string, model: string) =>
  `${(brand || '').charAt(0)}${(model || '').charAt(0)}`.toUpperCase();

/**
 * Shows an auto-fetched product image for a device, with a graceful
 * placeholder fallback. Image is contained (never cropped) and centered.
 */
const DeviceImage: React.FC<DeviceImageProps> = ({
  brand,
  model,
  className = '',
  aspectClass = 'aspect-[3/4]',
}) => {
  const { src, loading } = useDeviceImage(brand, model);

  return (
    <div
      className={`${aspectClass} relative overflow-hidden bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={`${brand} ${model}`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-4"
          onError={(e) => {
            // hide broken image so the placeholder underneath shows
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : loading ? (
        <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
          <Smartphone className="h-12 w-12 animate-pulse" strokeWidth={1} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
          <Smartphone className="h-14 w-14" strokeWidth={1} />
          <span className="text-xs font-semibold tracking-widest uppercase">
            {initials(brand, model)}
          </span>
        </div>
      )}
    </div>
  );
};

export default DeviceImage;
