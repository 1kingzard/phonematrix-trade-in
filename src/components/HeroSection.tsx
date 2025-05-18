
import React from 'react';
import { Card } from './ui/card';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  imageSrc: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  title, 
  subtitle, 
  imageSrc,
  primaryColor = '#d81570',
  secondaryColor = '#fce4f1'
}) => {
  const gradientStyle = {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
  };

  return (
    <div className="relative overflow-hidden" style={gradientStyle}>
      <div className="absolute inset-0 z-0 opacity-20">
        <img 
          src={imageSrc} 
          alt="Background" 
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="relative z-10 py-16 container mx-auto px-4 flex flex-col items-center text-white">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-center max-w-2xl mx-auto">
          {subtitle}
        </p>
        
        <Card className="mt-8 p-6 bg-white/10 backdrop-blur-sm border border-white/20 text-white max-w-lg w-full">
          <p className="text-center text-sm md:text-base">
            Find the perfect device for your needs or trade in your current one for an upgrade.
            Our easy-to-use tools help you make the right choice.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default HeroSection;
