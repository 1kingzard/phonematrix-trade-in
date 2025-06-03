
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashPage from "./pages/SplashPage";
import TradeIn from "./pages/TradeIn";
import PriceList from "./pages/PriceList";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import FAQPage from "./pages/FAQPage";
import ReviewsPage from "./pages/ReviewsPage";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SplashPage />} />
            <Route path="/trade-in" element={<TradeIn />} />
            <Route path="/price-list" element={<PriceList />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ScrollToTop />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
