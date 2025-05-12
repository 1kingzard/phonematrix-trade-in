
import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

const Header = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm py-4 px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="https://i.imgur.com/TcJEewx.png" 
            alt="PhoneMatrix Logo" 
            className="h-10"
          />
        </div>
        
        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-8 mr-4">
            <Link 
              to="/" 
              className="text-[#d81570] font-medium border-b-2 border-[#d81570] pb-1"
            >
              Trade-In
            </Link>
            <Link 
              to="/" 
              className="text-gray-600 dark:text-gray-300 hover:text-[#d81570] font-medium"
            >
              Price List
            </Link>
          </div>
          
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu - only visible on small screens */}
      <div className="md:hidden mt-3 border-t pt-3">
        <div className="flex justify-center space-x-8">
          <Link 
            to="/" 
            className="text-[#d81570] font-medium border-b-2 border-[#d81570] pb-1"
          >
            Trade-In
          </Link>
          <Link 
            to="/" 
            className="text-gray-600 dark:text-gray-300 hover:text-[#d81570] font-medium"
          >
            Price List
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
