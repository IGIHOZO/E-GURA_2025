import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <DocumentTextIcon className="h-16 w-16 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: November 2024</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using E-Gura Store ("the Service"), you accept and agree to be bound by the terms and 
              provisions of this agreement. If you do not agree to these Terms of Service, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Use the Service in any way that violates any applicable law or regulation</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use of the Service</li>
              <li>Impersonate or attempt to impersonate the Company, another user, or any other person</li>
              <li>Use any automated system to access the Service</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
            <p className="text-gray-700 leading-relaxed">
              To access certain features of the Service, you may be required to register for an account. You agree to 
              provide accurate, current, and complete information during registration and to update such information to 
              keep it accurate, current, and complete. You are responsible for safeguarding your password and for all 
              activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Products and Services</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              All products and services offered through E-Gura Store are subject to availability. We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Limit the quantities of products or services we offer</li>
              <li>Discontinue any product or service at any time</li>
              <li>Refuse service to anyone for any reason at any time</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We strive to provide accurate product descriptions and pricing. However, we do not warrant that product 
              descriptions, pricing, or other content is accurate, complete, reliable, current, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Pricing and Payment</h2>
            <p className="text-gray-700 leading-relaxed">
              All prices are in Rwandan Francs (RWF) and are subject to change without notice. Payment must be received 
              by us before your order is dispatched. We accept Mobile Money payments. You agree to provide current, 
              complete, and accurate purchase and account information for all purchases made via the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Shipping and Delivery</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We offer delivery services within Rwanda:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Free shipping within Kigali for orders above a certain amount</li>
              <li>Delivery times are estimates and not guaranteed</li>
              <li>Risk of loss and title for items pass to you upon delivery</li>
              <li>We are not responsible for delays caused by customs or other factors beyond our control</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Returns and Refunds</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Our return policy:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Products can be returned within 7 days of delivery</li>
              <li>Items must be unused and in original packaging</li>
              <li>Refunds will be processed within 14 business days</li>
              <li>Shipping costs are non-refundable unless the product is defective</li>
              <li>Some products may not be eligible for return (e.g., perishables, intimate items)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service and its original content, features, and functionality are owned by E-Gura Store and are 
              protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. 
              You may not reproduce, distribute, modify, create derivative works of, publicly display, or exploit any of 
              our content without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, E-Gura Store shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly 
              or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of 
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed and construed in accordance with the laws of Rwanda, without regard to its 
              conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be 
              subject to the exclusive jurisdiction of the courts of Rwanda.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is 
              material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a 
              material change will be determined at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-gray-700">📧 Email: support@egura.store</p>
              <p className="text-gray-700">📞 Phone: +250 782 013 955</p>
              <p className="text-gray-700">📍 Address: Kigali, Kimironko, Near Bank of Kigali, KG 156 St</p>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-6 mt-8">
            <p className="text-sm text-gray-600 text-center">
              By using E-Gura Store, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
