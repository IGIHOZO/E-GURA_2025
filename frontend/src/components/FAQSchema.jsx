import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

/**
 * FAQSchema Component
 * Provides FAQ structured data for SEO and visual FAQ section
 */
const FAQSchema = ({ faqs = [] }) => {
  const [openIndex, setOpenIndex] = useState(null);
  
  // Default FAQs if none provided
  const defaultFaqs = [
    {
      question: "What payment methods do you accept?",
      answer: "We accept MTN Mobile Money, Airtel Money, Cash on Delivery, and Bank Transfer. Mobile Money is the fastest and most convenient payment method for customers in Rwanda."
    },
    {
      question: "Do you deliver to all areas of Rwanda?",
      answer: "Yes! We deliver to all districts of Rwanda. Same-day delivery is available in Kigali, while other areas receive delivery within 2-7 business days depending on location."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 7-day hassle-free return policy. If you're not satisfied with your purchase, you can return it within 7 days for a full refund or exchange. Items must be in original condition."
    },
    {
      question: "Are all products genuine?",
      answer: "Absolutely! All products sold on E-Gura are 100% genuine and authentic. We work directly with authorized distributors and manufacturers to ensure quality."
    },
    {
      question: "How can I track my order?",
      answer: "After placing an order, you'll receive an SMS with your tracking number. You can also track your order anytime by visiting the Order Tracking page on our website."
    },
    {
      question: "Is it safe to shop online at E-Gura?",
      answer: "Yes, shopping at E-Gura is completely safe. We use secure payment gateways, SSL encryption, and follow best practices for data protection. Plus, Cash on Delivery is available if you prefer to pay upon receipt."
    },
    {
      question: "What are the delivery charges?",
      answer: "Delivery is FREE for orders above 50,000 RWF in Kigali. For other areas and smaller orders, delivery fees range from 2,000 to 5,000 RWF depending on location and package size."
    },
    {
      question: "How long does delivery take?",
      answer: "Kigali: 1-2 business days (same-day available). Other cities: 2-4 business days. Remote areas: 3-7 business days. We'll keep you updated via SMS throughout the delivery process."
    }
  ];
  
  const faqData = faqs.length > 0 ? faqs : defaultFaqs;
  
  // Generate FAQ structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      {/* Structured Data */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      {/* Visual FAQ Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div 
              key={index} 
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUpIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="p-4 pt-0 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-purple-800 mb-3">
            Our customer support team is here to help!
          </p>
          <div className="flex flex-wrap gap-4">
            <a 
              href="/contact" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Contact Us
            </a>
            <a 
              href="tel:+250788000000" 
              className="inline-flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Call: +250 788 000 000
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQSchema;
