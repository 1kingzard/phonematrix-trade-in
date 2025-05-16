
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

interface Step {
  title: string;
  description: string;
  image: string;
}

interface OnboardingGuideProps {
  steps?: Step[];
}

const defaultSteps: Step[] = [
  {
    title: "Welcome to Trade-in Calculator",
    description: "Get started with our easy-to-use device trade-in calculator.",
    image: "/placeholder.svg"
  },
  {
    title: "Select Your Device",
    description: "Choose the device you want to trade in from our extensive catalog.",
    image: "/placeholder.svg"
  },
  {
    title: "View Trade-in Value",
    description: "See how much your device is worth and proceed to upgrade options.",
    image: "/placeholder.svg"
  }
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ steps = defaultSteps }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

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
      <Card className="max-w-md w-full bg-white shadow-2xl animate-fade-in">
        <CardHeader className="relative">
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            aria-label="Close onboarding"
          >
            <X className="h-5 w-5" />
          </button>
          <CardTitle className="text-[#d81570]">{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video relative overflow-hidden rounded-md bg-gray-100">
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
                    : "bg-gray-200"
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
