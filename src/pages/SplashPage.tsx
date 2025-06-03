import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Smartphone, RefreshCcw, DollarSign, Star, CheckCircle, Users, Shield, Clock, Search, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '../components/Header';
import ThemeToggle from '../components/ThemeToggle';

const SplashPage = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const videoSources = [
    "https://videos.pexels.com/video-files/5692708/5692708-hd_1920_1080_25fps.mp4",
    "https://videos.pexels.com/video-files/8489737/8489737-hd_1920_1080_30fps.mp4",
    "https://videos.pexels.com/video-files/4816658/4816658-hd_1920_1080_30fps.mp4"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videoSources.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Header />
      
      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center">
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            key={currentVideoIndex}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover opacity-30 dark:opacity-20"
          >
            <source src={videoSources[currentVideoIndex]} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-[#d81570]/20 to-transparent"></div>
        </div>

        {/* Floating Elements */}
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute top-20 left-10 hidden lg:block"
        >
          <div className="w-16 h-16 bg-[#d81570]/20 rounded-full flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-[#d81570]" />
          </div>
        </motion.div>

        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: "1s" }}
          className="absolute top-40 right-20 hidden lg:block"
        >
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: "2s" }}
          className="absolute bottom-40 left-20 hidden lg:block"
        >
          <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
            <RefreshCcw className="w-7 h-7 text-green-500" />
          </div>
        </motion.div>

        {/* Hero Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center max-w-4xl mx-auto px-6"
        >
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#d81570] to-purple-600 bg-clip-text text-transparent"
          >
            PhoneMatrix
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed"
          >
            Your trusted partner for device trade-ins and upgrades. Get the best value for your devices with our transparent pricing and hassle-free process.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.div variants={pulseVariants} animate="animate">
              <Link to="/trade-in">
                <Button size="lg" className="bg-[#d81570] hover:bg-[#e83a8e] text-white px-8 py-4 text-lg">
                  Start Trade-in <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <Link to="/price-list">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-[#d81570] text-[#d81570] hover:bg-[#d81570] hover:text-white">
                View Prices
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-[#d81570]">10,000+</div>
              <div className="text-gray-600 dark:text-gray-400">Devices Traded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#d81570]">4.9★</div>
              <div className="text-gray-600 dark:text-gray-400">Customer Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#d81570]">24h</div>
              <div className="text-gray-600 dark:text-gray-400">Quick Processing</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-[#d81570] rounded-full flex justify-center">
            <div className="w-1 h-3 bg-[#d81570] rounded-full mt-2"></div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Why Choose PhoneMatrix?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience the future of device trading with our innovative platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure & Trusted",
                description: "Your devices and data are protected with enterprise-level security"
              },
              {
                icon: Clock,
                title: "Fast Processing",
                description: "Get quotes instantly and complete transactions within 24 hours"
              },
              {
                icon: Users,
                title: "Expert Support",
                description: "Our team of experts guides you through every step of the process"
              },
              {
                icon: Search,
                title: "Multi-Point Inspection",
                description: "Comprehensive inspection performed on all devices to ensure quality"
              },
              {
                icon: Award,
                title: "30-Day Warranty",
                description: "All devices come with a comprehensive 30-day warranty for peace of mind"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <Card className="p-8 h-full border-2 hover:border-[#d81570] transition-colors dark:bg-gray-700 dark:border-gray-600">
                  <div className="w-16 h-16 bg-[#d81570]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="w-8 h-8 text-[#d81570]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Simple, fast, and transparent</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Select Device",
                description: "Choose your current device from our extensive catalog"
              },
              {
                step: "2",
                title: "Get Quote",
                description: "Receive an instant quote based on your device's condition"
              },
              {
                step: "3",
                title: "Choose Upgrade",
                description: "Browse and select your next device (optional)"
              },
              {
                step: "4",
                title: "Complete Trade",
                description: "Submit your request and we'll handle the rest"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center relative"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-16 h-16 bg-[#d81570] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl"
                >
                  {step.step}
                </motion.div>
                
                {index < 3 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: (index + 1) * 0.2 }}
                    viewport={{ once: true }}
                    className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-[#d81570] origin-left"
                  />
                )}
                
                <h3 className="text-lg font-semibold mb-2 dark:text-white">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#d81570] to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6 text-white">Ready to Trade Your Device?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust PhoneMatrix for their device upgrades
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/trade-in">
                <Button size="lg" variant="secondary" className="bg-white text-[#d81570] hover:bg-gray-100 px-8 py-4 text-lg">
                  Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 dark:bg-gray-950 text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <img 
              src={logoSrc}
              alt="PhoneMatrix Logo" 
              className="h-8"
            />
            <ThemeToggle />
          </div>
          <p className="text-gray-400 dark:text-gray-300">
            &copy; {new Date().getFullYear()} PhoneMatrix. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SplashPage;
