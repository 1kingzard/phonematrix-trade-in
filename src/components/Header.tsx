
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <nav className="bg-white shadow-sm py-4 px-6 sticky top-0 z-50">
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
        <div className="flex space-x-8">
          <Link 
            to="/" 
            className="text-[#d81570] font-medium border-b-2 border-[#d81570] pb-1"
          >
            Trade-In
          </Link>
          <Link 
            to="/" 
            className="text-gray-600 hover:text-[#d81570] font-medium"
          >
            Price List
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
