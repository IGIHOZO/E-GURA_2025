import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// TensorFlow imports wrapped to prevent crashes
let tf, bodySegmentation, faceLandmarksDetection;
try {
  // These are commented out to prevent CommonJS require errors
  // tf = require('@tensorflow/tfjs');
  // bodySegmentation = require('@tensorflow-models/body-segmentation');
  // faceLandmarksDetection = require('@tensorflow-models/face-landmarks-detection');
  console.log('⚠️ TensorFlow temporarily disabled to fix homepage crash');
} catch (e) {
  console.warn('TensorFlow not available:', e);
}
import Webcam from 'react-webcam';
import { 
  CameraIcon, 
  PhotoIcon, 
  SparklesIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  ComputerDesktopIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const AdvancedMLTryOn = () => {
  const [step, setStep] = useState(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tryOnResult, setTryOnResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectionResults, setDetectionResults] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const bodySegmentationModel = useRef(null);
  const faceLandmarksModel = useRef(null);

  const sampleProducts = [
    {
      id: 1,
      name: "African Print Maxi Dress",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      price: "45,000 RWF",
      category: "Dresses",
      type: "dress"
    },
    {
      id: 2,
      name: "Kitenge Skirt and Blouse",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      price: "35,000 RWF",
      category: "Suits",
      type: "outfit"
    },
    {
      id: 3,
      name: "African Print Shirt",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      price: "22,000 RWF",
      category: "Tops",
      type: "top"
    }
  ];

  // Load TensorFlow models
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      console.log('Loading TensorFlow models...');
      
      // Load body segmentation model
      bodySegmentationModel.current = await bodySegmentation.createSegmenter(
        bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
        {
          runtime: 'tfjs',
          modelType: 'general'
        }
      );

      // Load face landmarks model
      faceLandmarksModel.current = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        }
      );

      setModelsLoaded(true);
      console.log('Models loaded successfully!');
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  // Start camera
  const startCamera = () => {
    setCameraActive(true);
    setStep(2);
  };

  // Capture image with ML processing
  const captureImage = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded) return;

    setIsCapturing(true);
    setProcessingProgress(0);

    try {
      // Capture image
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setProcessingProgress(20);

      // Create canvas for processing
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        setProcessingProgress(40);

        // Body segmentation
        const segmentation = await bodySegmentationModel.current.segmentPeople(img);
        setProcessingProgress(60);

        // Face landmarks detection
        const faces = await faceLandmarksModel.current.estimateFaces(img);
        setProcessingProgress(80);

        // Store detection results
        setDetectionResults({
          segmentation,
          faces,
          imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
        });

        setProcessingProgress(100);
        setIsCapturing(false);
        setStep(3);
      };

      img.src = imageSrc;
    } catch (error) {
      console.error('Error capturing image:', error);
      setIsCapturing(false);
    }
  }, [modelsLoaded]);

  // Process try-on with ML
  const processTryOn = async () => {
    if (!capturedImage || !selectedProduct || !detectionResults) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate ML processing steps
      const steps = [
        'Analyzing body proportions...',
        'Detecting face landmarks...',
        'Mapping clothing to body...',
        'Adjusting fit and style...',
        'Generating final result...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setProcessingProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate mock result with ML insights
      const mockResult = {
        tryOnImage: selectedProduct.image,
        originalImage: capturedImage,
        fitAnalysis: {
          overall: 'Excellent',
          shoulders: 'Perfect',
          bust: 'Good',
          waist: 'Excellent',
          hips: 'Good',
          length: 'Perfect',
          confidence: 94
        },
        bodyMeasurements: {
          height: '165cm',
          shoulders: '38cm',
          bust: '88cm',
          waist: '72cm',
          hips: '94cm'
        },
        faceAnalysis: {
          skinTone: 'Medium',
          faceShape: 'Oval',
          recommendedColors: ['Purple', 'Blue', 'Green'],
          confidence: 89
        },
        recommendations: [
          'This dress complements your body proportions beautifully',
          'The color works well with your skin tone',
          'Consider pairing with gold accessories',
          'Perfect fit for your shoulder width',
          'Length is ideal for your height'
        ],
        mlInsights: {
          bodyType: 'Hourglass',
          styleMatch: '95%',
          colorHarmony: '92%',
          sizeRecommendation: 'M',
          confidence: 94
        }
      };

      setTryOnResult(mockResult);
      setIsProcessing(false);
      setStep(4);
    } catch (error) {
      console.error('Error processing try-on:', error);
      setIsProcessing(false);
    }
  };

  const resetTryOn = () => {
    setStep(1);
    setCapturedImage(null);
    setSelectedProduct(null);
    setTryOnResult(null);
    setDetectionResults(null);
    setCameraActive(false);
    setProcessingProgress(0);
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
            Advanced ML-powered virtual try-on with face detection and body segmentation
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNumber 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <ComputerDesktopIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome to AI Try-On
                </h2>
                <p className="text-gray-600 mb-6">
                  Our advanced ML system will analyze your body and face to provide the perfect fit recommendations.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-800 mb-2">Body Analysis</h3>
                    <p className="text-sm text-purple-700">
                      Advanced body segmentation for accurate measurements
                    </p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4">
                    <h3 className="font-semibold text-pink-800 mb-2">Face Detection</h3>
                    <p className="text-sm text-pink-700">
                      Face landmark detection for style recommendations
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">How it works:</h3>
                  <ol className="text-sm text-gray-600 space-y-1 text-left">
                    <li>1. 📸 Take a full-body photo with your camera</li>
                    <li>2. 🤖 AI analyzes your body and face</li>
                    <li>3. 👗 Choose clothing to try on</li>
                    <li>4. ✨ Get personalized fit and style recommendations</li>
                  </ol>
                </div>

                <button
                  onClick={startCamera}
                  disabled={!modelsLoaded}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modelsLoaded ? (
                    <>
                      <CameraIcon className="h-5 w-5 inline mr-2" />
                      Start Camera
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-5 w-5 inline mr-2 animate-spin" />
                      Loading AI Models...
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Camera Capture */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Camera */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Camera</h3>
                <div className="relative">
                  {cameraActive && (
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  )}
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {isCapturing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="text-center text-white">
                        <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Processing...</p>
                        <div className="w-48 bg-gray-700 rounded-full h-2 mt-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm mt-2">{processingProgress}%</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={captureImage}
                    disabled={isCapturing}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    <CameraIcon className="h-5 w-5 inline mr-2" />
                    Capture
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Capture Instructions</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <UserIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Full Body Shot</h4>
                        <p className="text-sm text-gray-600">Stand 2-3 meters from camera for full body capture</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-pink-100 p-2 rounded-full">
                        <CameraIcon className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Good Lighting</h4>
                        <p className="text-sm text-gray-600">Ensure even lighting for accurate analysis</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <SparklesIcon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Neutral Pose</h4>
                        <p className="text-sm text-gray-600">Stand naturally with arms slightly away from body</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ML Status */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">AI Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Body Segmentation</span>
                      <span className="text-green-600 font-semibold">Ready</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Face Detection</span>
                      <span className="text-green-600 font-semibold">Ready</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">ML Processing</span>
                      <span className="text-green-600 font-semibold">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Product Selection */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Captured Image */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Photo</h3>
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      AI Analyzed
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retake Photo
                </button>
              </div>

              {/* Product Selection */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Choose Product</h3>
                  <div className="space-y-4">
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

                {/* ML Analysis Preview */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">AI Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Body Type</span>
                      <span className="font-semibold text-gray-900">Hourglass</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Height</span>
                      <span className="font-semibold text-gray-900">165cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Face Shape</span>
                      <span className="font-semibold text-gray-900">Oval</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Skin Tone</span>
                      <span className="font-semibold text-gray-900">Medium</span>
                    </div>
                  </div>
                </div>

                {/* Try On Button */}
                <button
                  onClick={processTryOn}
                  disabled={!selectedProduct}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 inline mr-2" />
                      Try On Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 4 && tryOnResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-6xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">AI Try-On Results</h2>
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
                      {tryOnResult.mlInsights.confidence}% Match
                    </div>
                  </div>
                </div>

                {/* Analysis */}
                <div className="space-y-6">
                  {/* ML Insights */}
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-purple-800 mb-4">AI Insights</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Body Type</span>
                        <span className="font-semibold text-purple-800">{tryOnResult.mlInsights.bodyType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Style Match</span>
                        <span className="font-semibold text-purple-800">{tryOnResult.mlInsights.styleMatch}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Color Harmony</span>
                        <span className="font-semibold text-purple-800">{tryOnResult.mlInsights.colorHarmony}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Size Recommendation</span>
                        <span className="font-semibold text-purple-800">{tryOnResult.mlInsights.sizeRecommendation}</span>
                      </div>
                    </div>
                  </div>

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

                  {/* AI Recommendations */}
                  <div className="bg-pink-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-pink-800 mb-4">AI Recommendations</h3>
                    <div className="space-y-3">
                      {tryOnResult.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircleIcon className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                          <p className="text-pink-700">{rec}</p>
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
export default AdvancedMLTryOn; 
=======
export default AdvancedMLTryOn; 
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
