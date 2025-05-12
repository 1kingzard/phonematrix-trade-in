
import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const OnboardingGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to PhoneMatrix Trade-in",
      description: "Get started with our simple trade-in process to upgrade your device or get cash for your old phone.",
      image: "https://i.imgur.com/Ea9JY6U.png",
    },
    {
      title: "Step 1: Select Your Current Device",
      description: "Use the filters to find your current device and click on it to select.",
      image: "https://i.imgur.com/yNt5KTz.png",
    },
    {
      title: "Step 2: Check Trade-in Value",
      description: "Review the value of your device and select any condition issues that apply.",
      image: "https://i.imgur.com/P8ZGxPD.png",
    },
    {
      title: "Step 3: Choose to Upgrade or Cash-in",
      description: "Select a new device for upgrade or request a cash value for your trade-in.",
      image: "https://i.imgur.com/2QuRzm4.png",
    },
    {
      title: "Step 4: Complete Your Request",
      description: "Fill in your contact details and any device issues to submit your trade-in request.",
      image: "https://i.imgur.com/ZnTbpCE.png",
    }
  ];

  const handleDismiss = () => {
    localStorage.setItem('onboardingDismissed', 'true');
    setIsOpen(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Check if previously dismissed
  React.useEffect(() => {
    const dismissed = localStorage.getItem('onboardingDismissed') === 'true';
    if (dismissed) {
      setIsOpen(false);
    }
  }, []);

  if (!isOpen) {
    return (
      <div className="fixed bottom-5 left-5 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-[#d81570] hover:bg-[#e83a8e] shadow-lg"
          size="sm"
        >
          <HelpCircle className="h-5 w-5 mr-1" /> Help
        </Button>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="max-w-md w-full bg-white dark:bg-gray-900 shadow-2xl animate-fade-in">
        <CardHeader className="relative">
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close onboarding"
          >
            <X className="h-5 w-5" />
          </button>
          <CardTitle className="text-[#d81570]">{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video relative overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
            <img
              src={currentStepData.image}
              alt={`Step ${currentStep + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex justify-center mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full mx-1 ${
                  currentStep === index
                    ? "bg-[#d81570]"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="border-[#d81570] text-[#d81570] hover:bg-[#fce4f1] disabled:opacity-50"
          >
            Previous
          </Button>
          <Button
            onClick={nextStep}
            className="bg-[#d81570] hover:bg-[#e83a8e]"
          >
            {currentStep < steps.length - 1 ? "Next" : "Get Started"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnboardingGuide;
