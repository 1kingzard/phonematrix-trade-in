
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface DeviceConditionImagesProps {
  isVisible: boolean;
}

const DeviceConditionImages: React.FC<DeviceConditionImagesProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="animate-fade-in p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-center">Device Condition Guide</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Like New</h4>
            <img 
              src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80" 
              alt="Like New Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600">
              Perfect condition with no visible scratches or signs of use. Looks and works like brand new.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Good</h4>
            <img 
              src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=80" 
              alt="Good Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600">
              Minor signs of wear but no significant scratches, dents or marks. Fully functional.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Fair</h4>
            <img 
              src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=500&q=80" 
              alt="Fair Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600">
              Visible signs of use with some scratches or marks. May have minor dents but fully functional.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Poor</h4>
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80" 
              alt="Poor Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600">
              Heavy signs of wear, significant scratches, dents or cracks. Still functional but visibly worn.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeviceConditionImages;
