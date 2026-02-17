import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CameraIcon, 
  PhotoIcon, 
  SparklesIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AdvancedVirtualTryOn = () => {
  const [step, setStep] = useState(1);
  const [userImage, setUserImage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tryOnResult, setTryOnResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bodyType, setBodyType] = useState('');
  const [skinTone, setSkinTone] = useState('');
  const [occasion, setOccasion] = useState('');
  const fileInputRef = useRef(null);

  const bodyTypes = [
    { id: 'hourglass', name: 'Hourglass', description: 'Balanced proportions' },
    { id: 'pear', name: 'Pear', description: 'Fuller hips and thighs' },
    { id: 'apple', name: 'Apple', description: 'Fuller midsection' },
    { id: 'rectangle', name: 'Rectangle', description: 'Straight proportions' },
    { id: 'inverted-triangle', name: 'Inverted Triangle', description: 'Broader shoulders' }
  ];

  const skinTones = [
    { id: 'fair', name: 'Fair', color: '#FFDBB4' },
    { id: 'light', name: 'Light', color: '#EDB98A' },
    { id: 'medium', name: 'Medium', color: '#D08B5B' },
    { id: 'olive', name: 'Olive', color: '#AE5D29' },
    { id: 'dark', name: 'Dark', color: '#8D4A43' },
    { id: 'deep', name: 'Deep', color: '#5C3836' }
  ];

  const occasions = [
    { id: 'casual', name: 'Casual', icon: '👕' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'formal', name: 'Formal', icon: '👗' },
    { id: 'party', name: 'Party', icon: '🎉' },
    { id: 'wedding', name: 'Wedding', icon: '💒' }
  ];

  const sampleProducts = [
    {
      id: 1,
      name: "African Print Maxi Dress",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      price: "45,000 RWF",
      category: "Dresses"
    },
    {
      id: 2,
      name: "Kitenge Skirt and Blouse",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      price: "35,000 RWF",
      category: "Suits"
    },
    {
      id: 3,
      name: "Modern African Fusion Dress",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      price: "55,000 RWF",
      category: "Dresses"
    }
  ];

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserImage(e.target.result);
        setStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = async () => {
    if (!userImage || !selectedProduct || !bodyType || !skinTone || !occasion) {
      alert('Please complete all selections before trying on');
      return;
    }

    setIsProcessing(true);
    
    // Simulate ML processing
    setTimeout(() => {
      const mockResult = {
        tryOnImage: selectedProduct.image,
        fitAnalysis: {
          overall: 'Excellent',
          shoulders: 'Perfect',
          bust: 'Good',
          waist: 'Excellent',
          hips: 'Good',
          length: 'Perfect'
        },
        recommendations: [
          'This dress complements your hourglass figure beautifully',
          'The color works well with your skin tone',
          'Perfect for the selected occasion',
          'Consider pairing with gold accessories'
        ],
        confidence: 94
      };
      
      setTryOnResult(mockResult);
      setIsProcessing(false);
      setStep(3);
    }, 3000);
  };

  const resetTryOn = () => {
    setStep(1);
    setUserImage(null);
    setSelectedProduct(null);
    setTryOnResult(null);
    setBodyType('');
    setSkinTone('');
    setOccasion('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <SparklesIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Virtual Try-On
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Experience the future of fashion with our advanced AI-powered virtual try-on technology
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNumber 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Upload Image */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <CameraIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Upload Your Photo
                </h2>
                <p className="text-gray-600">
                  Take a full-body photo or upload one to get started
                </p>
              </div>

              <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                <PhotoIcon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Click to upload or drag and drop
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Choose Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Tips for best results:</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Take a full-body photo in good lighting</li>
                  <li>• Wear form-fitting clothes or swimwear</li>
                  <li>• Stand against a plain background</li>
                  <li>• Ensure your full body is visible</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Options */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Image Preview */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Photo</h3>
                <div className="relative">
                  <img
                    src={userImage}
                    alt="User"
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setStep(1)}
                    className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
                  >
                    <ArrowPathIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Options Selection */}
              <div className="space-y-6">
                {/* Body Type */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Body Type</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {bodyTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setBodyType(type.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          bodyType === type.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-800">{type.name}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skin Tone */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Skin Tone</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {skinTones.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => setSkinTone(tone.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          skinTone === tone.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full mx-auto mb-2"
                          style={{ backgroundColor: tone.color }}
                        />
                        <div className="text-sm font-medium text-gray-800">{tone.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Occasion */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Occasion</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {occasions.map((occ) => (
                      <button
                        key={occ.id}
                        onClick={() => setOccasion(occ.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          occasion === occ.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{occ.icon}</div>
                        <div className="font-medium text-gray-800">{occ.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Selection */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Choose Product</h3>
                  <div className="space-y-3">
                    {sampleProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={`w-full p-4 rounded-lg border-2 transition-all ${
                          selectedProduct?.id === product.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-20 object-cover rounded"
                          />
                          <div className="text-left">
                            <div className="font-semibold text-gray-800">{product.name}</div>
                            <div className="text-sm text-gray-600">{product.category}</div>
                            <div className="text-purple-600 font-semibold">{product.price}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Try On Button */}
                <button
                  onClick={handleTryOn}
                  disabled={!userImage || !selectedProduct || !bodyType || !skinTone || !occasion}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : (
                    'Try On Now'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Results */}
        {step === 3 && tryOnResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-6xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Try-On Results</h2>
                <button
                  onClick={resetTryOn}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Try Another
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Try-On Image */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800">Virtual Try-On</h3>
                  <div className="relative">
                    <img
                      src={tryOnResult.tryOnImage}
                      alt="Try-on result"
                      className="w-full h-96 object-cover rounded-lg"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {tryOnResult.confidence}% Match
                    </div>
                  </div>
                </div>

                {/* Analysis */}
                <div className="space-y-6">
                  {/* Fit Analysis */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Fit Analysis</h3>
                    <div className="space-y-3">
                      {Object.entries(tryOnResult.fitAnalysis).map(([part, fit]) => (
                        <div key={part} className="flex justify-between items-center">
                          <span className="capitalize text-gray-700">{part}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            fit === 'Perfect' ? 'bg-green-100 text-green-800' :
                            fit === 'Excellent' ? 'bg-blue-100 text-blue-800' :
                            fit === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {fit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-purple-800 mb-4">AI Recommendations</h3>
                    <div className="space-y-3">
                      {tryOnResult.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircleIcon className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <p className="text-purple-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors">
                      Add to Cart
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors">
                      Save to Wishlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default AdvancedVirtualTryOn; 
=======
export default AdvancedVirtualTryOn; 
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
