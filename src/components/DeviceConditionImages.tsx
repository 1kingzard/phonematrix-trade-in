
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
              No noticeable blemishes and in excellent cosmetic condition. Battery health generally 95% or higher.
            </p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-700 dark:text-white">
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Very Good</h4>
            <img 
              src="https://i.imgur.com/FQJJk9a.png" 
              alt="Very Good Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Little to no noticeable blemishes and in very good overall condition. Battery health generally 85% or higher.
            </p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-700 dark:text-white">
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Good</h4>
            <img 
              src="https://i.imgur.com/z2BbOwh.png" 
              alt="Good Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              May have visible scratches or other signs of normal use but fully functional. Battery health generally 80% or higher.
            </p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-700 dark:text-white">
          <CardContent className="p-4">
            <h4 className="text-center font-medium mb-2">Fair</h4>
            <img 
              src="https://i.imgur.com/pLvbhzy.png" 
              alt="Fair Condition" 
              className="w-full h-48 object-cover rounded mb-2" 
            />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              May have visible scratches, significant cosmetic wear, poor battery health, functional faults, or other issues that reduce its value.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeviceConditionImages;
