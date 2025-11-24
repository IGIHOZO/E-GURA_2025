import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  CameraIcon, 
  PhotoIcon, 
  SparklesIcon,
  HeartIcon,
  ShoppingCartIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const VirtualTryOn = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [tryOnResult, setTryOnResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bodyType, setBodyType] = useState('');
  const [skinTone, setSkinTone] = useState('');
  const [occasion, setOccasion] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVirtualTryOn = async () => {
    if (!selectedImage || !bodyType || !skinTone) {
      alert('Please upload an image and select your body type and skin tone');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Mock API call - in real app, this would call the backend
      const response = await fetch('/api/ai/virtual-tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userImage: selectedImage,
          bodyType,
          skinTone,
          preferences: {
            style: 'modern',
            occasion: occasion || 'casual'
          }
        }),
      });

      const result = await response.json();
      setTryOnResult(result);
    } catch (error) {
      console.error('Error processing virtual try-on:', error);
      // Mock result for demonstration
      setTryOnResult({
        success: true,
        tryOnImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
        confidence: 0.85,
        recommendations: [
          'This dress complements your skin tone perfectly',
          'Consider pairing with gold accessories',
          'Perfect for Kigali weather and occasions'
        ],
        fitAnalysis: {
          fit: 'Excellent',
          comfort: 'High',
          styleMatch: 'Perfect',
          occasionSuitability: 'Wedding, Party, Church'
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const bodyTypes = [
    { value: 'hourglass', label: 'Hourglass', description: 'Balanced proportions' },
    { value: 'pear', label: 'Pear', description: 'Wider hips, smaller bust' },
    { value: 'apple', label: 'Apple', description: 'Wider midsection' },
    { value: 'rectangle', label: 'Rectangle', description: 'Straight proportions' },
    { value: 'inverted-triangle', label: 'Inverted Triangle', description: 'Wider shoulders' }
  ];

  const skinTones = [
    { value: 'fair', label: 'Fair', color: '#FFDBB4' },
    { value: 'light', label: 'Light', color: '#EDB98A' },
    { value: 'medium', label: 'Medium', color: '#D08B5B' },
    { value: 'olive', label: 'Olive', color: '#AE5D29' },
    { value: 'dark', label: 'Dark', color: '#8D4A43' },
    { value: 'deep', label: 'Deep', color: '#5C3836' }
  ];

  const occasions = [
    { value: 'casual', label: 'Casual', icon: '👕' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'party', label: 'Party', icon: '🎉' },
    { value: 'wedding', label: 'Wedding', icon: '💒' },
    { value: 'church', label: 'Church', icon: '⛪' },
    { value: 'traditional', label: 'Traditional', icon: '👘' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-orange-900 mb-4">
            Virtual Try-On Experience
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the future of fashion shopping with our AI-powered virtual try-on. 
            See how our African fashion pieces look on you, tailored for Kigali's style and climate.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Your Photo</h2>
            
            {/* Image Upload */}
            <div className="mb-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition-colors"
              >
                {selectedImage ? (
                  <img 
                    src={selectedImage} 
                    alt="Uploaded" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div>
                    <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Click to upload your photo</p>
                    <p className="text-sm text-gray-500 mt-2">JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Body Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Body Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {bodyTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setBodyType(type.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      bodyType === type.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Tone Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Skin Tone
              </label>
              <div className="flex gap-3 flex-wrap">
                {skinTones.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setSkinTone(tone.value)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      skinTone === tone.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2 mx-auto"
                      style={{ backgroundColor: tone.color }}
                    ></div>
                    <div className="text-sm font-medium text-gray-900">{tone.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Occasion Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Occasion
              </label>
              <div className="grid grid-cols-3 gap-3">
                {occasions.map((occ) => (
                  <button
                    key={occ.value}
                    onClick={() => setOccasion(occ.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      occasion === occ.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{occ.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{occ.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Try-On Button */}
            <button
              onClick={handleVirtualTryOn}
              disabled={isProcessing || !selectedImage}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                isProcessing || !selectedImage
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-900 text-white hover:bg-orange-800'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Try On Now
                </>
              )}
            </button>
          </motion.div>

          {/* Results Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Try-On Results</h2>
            
            {tryOnResult ? (
              <div className="space-y-6">
                {/* Try-On Image */}
                <div className="relative">
                  <img 
                    src={tryOnResult.tryOnImage} 
                    alt="Virtual Try-On" 
                    className="w-full h-80 object-cover rounded-lg"
                  />
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
                    {Math.round(tryOnResult.confidence * 100)}% Match
                  </div>
                </div>

                {/* Fit Analysis */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Fit Analysis</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Fit</div>
                      <div className="font-medium text-gray-900">{tryOnResult.fitAnalysis.fit}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Comfort</div>
                      <div className="font-medium text-gray-900">{tryOnResult.fitAnalysis.comfort}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Style Match</div>
                      <div className="font-medium text-gray-900">{tryOnResult.fitAnalysis.styleMatch}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Occasions</div>
                      <div className="font-medium text-gray-900">{tryOnResult.fitAnalysis.occasionSuitability}</div>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">AI Recommendations</h3>
                  <div className="space-y-2">
                    {tryOnResult.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <StarIcon className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-orange-900 text-white py-2 px-4 rounded-lg hover:bg-orange-800 transition-colors flex items-center justify-center gap-2">
                    <HeartIcon className="h-4 w-4" />
                    Add to Wishlist
                  </button>
                  <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <ShoppingCartIcon className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Upload your photo and try on our fashion pieces</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Kigali Fashion Tips */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-orange-900 to-orange-700 rounded-xl p-8 text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Kigali Fashion Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">🌤️ Weather Considerations</h3>
              <p className="text-orange-100">
                Kigali's tropical highland climate means light, breathable fabrics work best year-round.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🎉 Cultural Occasions</h3>
              <p className="text-orange-100">
                From weddings to church services, our pieces are designed for Rwanda's special occasions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">✨ Local Style</h3>
              <p className="text-orange-100">
                Blend traditional African prints with modern silhouettes for authentic Kigali style.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default VirtualTryOn; 
=======
export default VirtualTryOn; 
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
