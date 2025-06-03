
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import CartSheet from './CartSheet';

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currency] = useState<'USD' | 'JMD'>('USD'); // You can make this dynamic later
  
  const isSplashPage = location.pathname === '/';
  const isTradeInPage = location.pathname === '/trade-in';
  const isPriceListPage = location.pathname === '/price-list';
  
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm py-4 px-6 sticky top-0 z-50">
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
              className={`font-medium ${isSplashPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 dark:text-gray-300 hover:text-[#d81570]'}`}
            >
              Home
            </Link>
            <Link 
              to="/trade-in" 
              className={`font-medium ${isTradeInPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 dark:text-gray-300 hover:text-[#d81570]'}`}
            >
              Trade-In
            </Link>
            <Link 
              to="/price-list" 
              className={`font-medium ${isPriceListPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 dark:text-gray-300 hover:text-[#d81570]'}`}
            >
              Price List
            </Link>
          </div>
          
          {/* Cart and Auth Section */}
          <div className="flex items-center space-x-2">
            <CartSheet currency={currency} />
            
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                  Hello, {user.name}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAuthModal(true)}
                className="text-gray-600 dark:text-gray-300 hover:text-[#d81570]"
              >
                <User className="h-4 w-4 mr-1" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu - only visible on small screens */}
      <div className="md:hidden mt-3 border-t pt-3">
        <div className="flex justify-center space-x-6">
          <Link 
            to="/" 
            className={`font-medium text-sm ${isSplashPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 dark:text-gray-300 hover:text-[#d81570]'}`}
          >
            Home
          </Link>
          <Link 
            to="/trade-in" 
            className={`font-medium text-sm ${isTradeInPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 dark:text-gray-300 hover:text-[#d81570]'}`}
          >
            Trade-In
          </Link>
          <Link 
            to="/price-list" 
            className={`font-medium text-sm ${isPriceListPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 dark:text-gray-300 hover:text-[#d81570]'}`}
          >
            Price List
          </Link>
        </div>
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </nav>
  );
};

export default Header;
