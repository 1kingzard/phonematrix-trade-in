
import React from 'react';
import Header from '../components/Header';
import FAQSection from '../components/FAQSection';
import ThemeToggle from '../components/ThemeToggle';
import ScrollToTop from '../components/ScrollToTop';

const FAQPage = () => {
  // FAQ data
  const faqs = [
    {
      question: "How does the trade-in process work?",
      answer: "Our trade-in process is simple: Select your current device, choose a device to upgrade to (optional), submit your trade-in request, and our team will contact you to arrange inspection and payment."
    },
    {
      question: "What condition should my device be in?",
      answer: "We accept devices in various conditions from Like New to Poor. The better the condition, the higher the trade-in value. Devices should be functional unless specified otherwise."
    },
    {
      question: "How long does the trade-in process take?",
      answer: "Once you submit your request, our team will contact you within 24-48 hours. The entire process typically takes 3-5 business days from inspection to payment."
    },
    {
      question: "Can I trade in multiple devices at once?",
      answer: "Yes, you can trade in multiple devices. Please submit separate trade-in requests for each device."
    },
    {
      question: "What payment methods do you offer?",
      answer: "We offer payment via bank transfer, cash, or store credit. Store credit offers an additional 10% bonus on your trade-in value."
    },
    {
      question: "Do you buy devices with cracked screens?",
      answer: "Yes, we do buy devices with cracked screens, though at a reduced value. These would typically fall into the 'Poor' condition category."
    },
    {
      question: "What happens if my device is in worse condition than described?",
      answer: "Our technicians will inspect your device upon receipt. If the condition doesn't match your description, we'll contact you with a revised offer. You can then accept the new offer or have your device returned at no cost."
    },
    {
      question: "Can I trade in a device that doesn't power on?",
      answer: "We do buy some non-functioning devices, but at a significantly reduced price. Please contact our customer service for specific details about your device."
    },
    {
      question: "How is the trade-in value determined?",
      answer: "Trade-in values are based on the device model, storage capacity, condition, and current market demand. Our pricing algorithms are updated regularly to ensure you get the best value."
    },
    {
      question: "What information do I need to remove from my device before trade-in?",
      answer: "Please remove all personal information from your device before sending it in. This includes signing out of accounts (Apple ID, Google account, etc.), removing SIM cards and memory cards, and performing a factory reset."
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-8 text-[#d81570] dark:text-[#ff7eb6]">Frequently Asked Questions</h1>
        
        <div className="max-w-4xl mx-auto">
          <FAQSection 
            faqs={faqs}
            title="" // Empty title since we already have the h1
          />
        </div>
      </main>
      
      <ScrollToTop />
    </div>
  );
};

export default FAQPage;
