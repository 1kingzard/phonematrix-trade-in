
import React from 'react';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  imageSrc: string;
  primaryColor?: string;
  secondaryColor?: string;
  ctaText?: string;
  ctaLink?: string;
  onCtaClick?: () => void;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  overlay?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  title, 
  subtitle, 
  imageSrc,
  primaryColor = '#000000',
  secondaryColor = '#ffffff',
  ctaText,
  ctaLink,
  onCtaClick,
  height = 'lg',
  overlay = true
}) => {
  const heightClasses = {
    sm: 'h-[50vh]',
    md: 'h-[60vh]',
    lg: 'h-[80vh]',
    xl: 'h-screen'
  };

  return (
    <section className={`relative ${heightClasses[height]} flex items-center justify-center overflow-hidden`}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={imageSrc} 
          alt="Hero Background" 
          className="w-full h-full object-cover"
        />
        {overlay && (
          <div className="absolute inset-0 bg-black/40"></div>
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
        
        {ctaText && (
          <Button 
            size="lg" 
            className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg font-medium"
            onClick={onCtaClick}
          >
            {ctaText} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
