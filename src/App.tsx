
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { PurchaseHistoryProvider } from '@/contexts/PurchaseHistoryContext';
import { ThemeProvider } from '@/components/theme-provider';
import Index from '@/pages/Index';
import TradeIn from '@/pages/TradeIn';
import Dashboard from '@/pages/Dashboard';
import UserDashboard from '@/pages/UserDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import PriceList from '@/pages/PriceList';
import ReviewsPage from '@/pages/ReviewsPage';
import FAQPage from '@/pages/FAQPage';
import LoginPage from '@/pages/LoginPage';
import SplashPage from '@/pages/SplashPage';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <PurchaseHistoryProvider>
                <Router>
                  <div className="min-h-screen bg-background">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/trade-in" element={<TradeIn />} />
                      <Route path="/dashboard" element={<UserDashboard />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/price-list" element={<PriceList />} />
                      <Route path="/reviews" element={<ReviewsPage />} />
                      <Route path="/faq" element={<FAQPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/splash" element={<SplashPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster />
                  </div>
                </Router>
              </PurchaseHistoryProvider>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
