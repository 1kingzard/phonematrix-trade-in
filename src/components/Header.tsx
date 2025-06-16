import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, LayoutDashboard } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout, isLoading } = useAuth();
  
  const isSplashPage = location.pathname === '/';
  const isTradeInPage = location.pathname === '/trade-in';
  const isPriceListPage = location.pathname === '/price-list';
  const isLoginPage = location.pathname === '/login';
  const isDashboardPage = location.pathname === '/dashboard';

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

  const getUserDisplayName = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
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
        
        {/* Navigation Links */}
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
            {user && (
              <Link 
                to="/dashboard" 
                className={`font-medium ${isDashboardPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 dark:text-gray-300 hover:text-[#d81570]'}`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth Section */}
          {!isLoading && (
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#d81570] text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                !isLoginPage && (
                  <Button asChild>
                    <Link to="/login">
                      <User className="mr-2 h-4 w-4" />
                      Sign In
                    </Link>
                  </Button>
                )
              )}
            </div>
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
          {user && (
            <Link 
              to="/dashboard" 
              className={`font-medium text-sm ${isDashboardPage ? 'text-[#d81570] border-b-2 border-[#d81570] pb-1' : 'text-gray-600 dark:text-gray-300 hover:text-[#d81570]'}`}
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
