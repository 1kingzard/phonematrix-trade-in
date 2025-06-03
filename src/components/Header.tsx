
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const isSplashPage = location.pathname === '/';
  const isTradeInPage = location.pathname === '/trade-in';
  const isPriceListPage = location.pathname === '/price-list';
  
  return (
    <nav className="bg-white shadow-sm py-4 px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/">
            <img 
              src="https://i.imgur.com/TcJEewx.png" 
              alt="PhoneMatrix Logo" 
              className="h-10"
            />
          </Link>
        </div>
        
        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-8 mr-4">
            <Link 
              to="/" 
              className={`font-medium ${isSplashPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 hover:text-[#d81570]'}`}
            >
              Home
            </Link>
            <Link 
              to="/trade-in" 
              className={`font-medium ${isTradeInPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 hover:text-[#d81570]'}`}
            >
              Trade-In
            </Link>
            <Link 
              to="/price-list" 
              className={`font-medium ${isPriceListPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 hover:text-[#d81570]'}`}
            >
              Price List
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu - only visible on small screens */}
      <div className="md:hidden mt-3 border-t pt-3">
        <div className="flex justify-center space-x-6">
          <Link 
            to="/" 
            className={`font-medium text-sm ${isSplashPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 hover:text-[#d81570]'}`}
          >
            Home
          </Link>
          <Link 
            to="/trade-in" 
            className={`font-medium text-sm ${isTradeInPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 hover:text-[#d81570]'}`}
          >
            Trade-In
          </Link>
          <Link 
            to="/price-list" 
            className={`font-medium text-sm ${isPriceListPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 hover:text-[#d81570]'}`}
          >
            Price List
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
