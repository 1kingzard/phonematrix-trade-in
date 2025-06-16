import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Shield } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const isSplashPage = location.pathname === '/';
  const isTradeInPage = location.pathname === '/trade-in';
  const isPriceListPage = location.pathname === '/price-list';

  // Watch for dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    // Initial check
    checkDarkMode();

    // Create observer to watch for class changes on document element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => observer.disconnect();
  }, []);

  const logoSrc = isDarkMode ? 'https://i.imgur.com/dAkmFGF.png' : 'https://i.imgur.com/TcJEewx.png';

  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm py-4 px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/">
            <img 
              src={logoSrc}
              alt="PhoneMatrix Logo" 
              className="h-10"
            />
          </Link>
        </div>
        
        {/* Navigation Links & Auth */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-8">
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

          {/* Auth Section */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {user.user_metadata?.first_name || user.email?.split('@')[0] || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
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
    </nav>
  );
};

export default Header;