
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type FAQItem = {
  question: string;
  answer: string;
};

interface FAQSectionProps {
  faqs: FAQItem[];
  title?: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({ 
  faqs,
  title = "Frequently Asked Questions" 
}) => {
  return (
    <div className="py-12 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        {title && <h2 className="text-3xl font-bold text-center mb-12 text-[#d81570] dark:text-[#ff7eb6]">{title}</h2>}
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg p-2 dark:border-gray-700">
                <AccordionTrigger className="text-lg font-medium text-left px-4 dark:text-white">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4 text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
