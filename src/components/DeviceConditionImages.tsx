
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface DeviceConditionImagesProps {
  isVisible: boolean;
}

const DeviceConditionImages: React.FC<DeviceConditionImagesProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="animate-fade-in p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-center">Device Condition Guide</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-700 dark:text-white">
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Like New</h4>
            <img 
              src="https://i.imgur.com/DRmnUNu.png" 
              alt="Like New Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Perfect condition with no visible scratches or signs of use. Looks and works like brand new and battery health is over 85%.
            </p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-700 dark:text-white">
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Good</h4>
            <img 
              src="https://i.imgur.com/FQJJk9a.png" 
              alt="Good Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Minor signs of wear but no significant scratches, dents or marks. Fully functional with battery health above 82%.
            </p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-700 dark:text-white">
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Fair</h4>
            <img 
              src="https://i.imgur.com/z2BbOwh.png" 
              alt="Fair Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Visible signs of use with some scratches or marks. May have battery, screen or other components changed to ensure full functionality with or without minor dents. Battery health is above 80%.
            </p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-700 dark:text-white">
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Poor</h4>
            <img 
              src="https://i.imgur.com/pLvbhzy.png" 
              alt="Poor Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Heavy signs of wear, significant scratches, dents or cracks. Still functional but visibly worn. Key components have been changed or in very rare cases, Face ID doesn't work.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeviceConditionImages;
