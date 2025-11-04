import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  DevicePhoneMobileIcon, 
  ComputerDesktopIcon,
  SparklesIcon,
  TvIcon,
  CameraIcon,
  MusicalNoteIcon,
  HomeIcon as HomeIconOutline,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

const CategoryBanners3D = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Category banners with 3D effects
  const categories = [
    {
      name: 'Electronics',
      category: 'electronics',
      title: 'Latest Electronics',
      subtitle: 'Smartphones, Laptops & More',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&q=80',
      gradient: 'from-blue-600 via-blue-500 to-cyan-400',
      icon: DevicePhoneMobileIcon,
      description: 'Discover cutting-edge technology',
      keywords: 'smartphones, laptops, tablets, electronics, gadgets'
    },
    {
      name: 'Computers',
      category: 'computers',
      title: 'Powerful Computing',
      subtitle: 'Gaming PCs, Laptops & Accessories',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1200&q=80',
      gradient: 'from-purple-600 via-purple-500 to-pink-400',
      icon: ComputerDesktopIcon,
      description: 'High-performance computers for work and play',
      keywords: 'computers, laptops, gaming PCs, workstations'
    },
    {
      name: 'Audio',
      category: 'audio',
      title: 'Premium Audio',
      subtitle: 'Speakers, Headphones & Sound Systems',
      image: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=1200&q=80',
      gradient: 'from-orange-600 via-red-500 to-pink-400',
      icon: MusicalNoteIcon,
      description: 'Immersive sound experience',
      keywords: 'speakers, headphones, earbuds, audio systems'
    },
    {
      name: 'Smart Home',
      category: 'smart-home',
      title: 'Smart Living',
      subtitle: 'IoT Devices & Home Automation',
      image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80',
      gradient: 'from-green-600 via-teal-500 to-blue-400',
      icon: HomeIconOutline,
      description: 'Transform your home with smart technology',
      keywords: 'smart home, IoT, home automation, smart devices'
    },
    {
      name: 'Cameras',
      category: 'cameras',
      title: 'Photography Gear',
      subtitle: 'DSLR, Mirrorless & Accessories',
      image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&q=80',
      gradient: 'from-indigo-600 via-purple-500 to-pink-400',
      icon: CameraIcon,
      description: 'Capture life\'s precious moments',
      keywords: 'cameras, DSLR, mirrorless, photography equipment'
    },
    {
      name: 'Entertainment',
      category: 'entertainment',
      title: 'Home Entertainment',
      subtitle: 'TVs, Projectors & Gaming',
      image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1200&q=80',
      gradient: 'from-red-600 via-orange-500 to-yellow-400',
      icon: TvIcon,
      description: 'Ultimate entertainment experience',
      keywords: 'TVs, projectors, gaming consoles, entertainment'
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % categories.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isHovered, categories.length]);

  // Mouse move effect for 3D tilt
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % categories.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + categories.length) % categories.length);
  };

  return (
    <section className="relative w-full overflow-hidden bg-gray-50 py-12">
      {/* SEO Content */}
      <div className="sr-only">
        <h2>Shop by Category - E-Gura Online Store</h2>
        <p>
          Browse our wide selection of products across multiple categories including 
          electronics, computers, audio equipment, smart home devices, cameras, and 
          entertainment systems. Find the best deals on smartphones, laptops, speakers, 
          headphones, DSLR cameras, TVs, and more.
        </p>
        {categories.map((cat) => (
          <div key={cat.category}>
            <h3>{cat.name} - {cat.subtitle}</h3>
            <p>{cat.description}</p>
            <span>{cat.keywords}</span>
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center space-x-3">
            <SparklesIcon className="h-10 w-10 text-orange-600" />
            <span>Shop by Category</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Explore our premium collection
          </p>
        </motion.div>

        {/* Main 3D Banner Slider */}
        <div 
          className="relative h-[500px] perspective-1000"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotateY: 0,
                rotateX: (mousePosition.y - 0.5) * 10,
                rotateZ: (mousePosition.x - 0.5) * 5
              }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              className="absolute inset-0 transform-gpu"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              <Link
                to={`/category/${categories[currentSlide].category}`}
                className="block h-full group"
                aria-label={`Shop ${categories[currentSlide].name} - ${categories[currentSlide].subtitle}`}
              >
                <div className="relative h-full rounded-3xl overflow-hidden shadow-2xl">
                  {/* Background Image with Parallax */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      scale: isHovered ? 1.1 : 1,
                      x: (mousePosition.x - 0.5) * 20,
                      y: (mousePosition.y - 0.5) * 20
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={categories[currentSlide].image}
                      alt={`${categories[currentSlide].name} category banner`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${categories[currentSlide].gradient} opacity-70`} />
                  </motion.div>

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-center px-12 md:px-20 text-white z-10">
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-4"
                    >
                      {/* Icon */}
                      <motion.div
                        animate={{
                          y: isHovered ? -10 : 0,
                          rotateZ: isHovered ? 360 : 0
                        }}
                        transition={{ duration: 0.6 }}
                      >
                        {React.createElement(categories[currentSlide].icon, {
                          className: "h-20 w-20 mb-4 drop-shadow-lg"
                        })}
                      </motion.div>

                      {/* Category Name */}
                      <h3 className="text-6xl font-black tracking-tight drop-shadow-2xl">
                        {categories[currentSlide].title}
                      </h3>
                      
                      {/* Subtitle */}
                      <p className="text-2xl font-medium text-white/90 drop-shadow-lg">
                        {categories[currentSlide].subtitle}
                      </p>

                      {/* Description */}
                      <p className="text-lg text-white/80 max-w-md">
                        {categories[currentSlide].description}
                      </p>

                      {/* CTA Button */}
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center space-x-2 bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all group-hover:bg-orange-600 group-hover:text-white mt-6"
                      >
                        <ShoppingBagIcon className="h-6 w-6" />
                        <span>Shop Now</span>
                        <motion.svg
                          className="h-5 w-5"
                          animate={{ x: isHovered ? 5 : 0 }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </motion.svg>
                      </motion.button>
                    </motion.div>
                  </div>

                  {/* 3D Floating Elements */}
                  <motion.div
                    className="absolute top-20 right-20 w-32 h-32 bg-white/10 backdrop-blur-md rounded-full"
                    animate={{
                      y: isHovered ? -20 : 0,
                      rotateZ: [0, 360],
                      scale: isHovered ? 1.2 : 1
                    }}
                    transition={{
                      rotateZ: { duration: 20, repeat: Infinity, ease: "linear" },
                      y: { duration: 0.6 },
                      scale: { duration: 0.6 }
                    }}
                    style={{ transformStyle: 'preserve-3d', transform: 'translateZ(50px)' }}
                  />
                  
                  <motion.div
                    className="absolute bottom-32 left-20 w-24 h-24 bg-white/10 backdrop-blur-md rounded-xl"
                    animate={{
                      y: isHovered ? 20 : 0,
                      rotateZ: [0, -360],
                      scale: isHovered ? 1.2 : 1
                    }}
                    transition={{
                      rotateZ: { duration: 15, repeat: Infinity, ease: "linear" },
                      y: { duration: 0.6 },
                      scale: { duration: 0.6 }
                    }}
                    style={{ transformStyle: 'preserve-3d', transform: 'translateZ(30px)' }}
                  />
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all group"
            aria-label="Previous category"
          >
            <svg className="h-6 w-6 text-gray-900 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all group"
            aria-label="Next category"
          >
            <svg className="h-6 w-6 text-gray-900 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
            {categories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all ${
                  index === currentSlide
                    ? 'w-12 bg-white'
                    : 'w-3 bg-white/50 hover:bg-white/70'
                } h-3 rounded-full`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Category Grid Preview */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, index) => (
            <Link
              key={cat.category}
              to={`/category/${cat.category}`}
              onClick={() => setCurrentSlide(index)}
              className="group"
              aria-label={`View ${cat.name} category`}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative h-32 rounded-xl overflow-hidden shadow-lg ${
                  index === currentSlide ? 'ring-4 ring-orange-500' : ''
                }`}
              >
                <img
                  src={cat.image}
                  alt={`${cat.name} category thumbnail`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-60 group-hover:opacity-70 transition-opacity`} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  {React.createElement(cat.icon, {
                    className: "h-8 w-8 mb-2"
                  })}
                  <p className="font-bold text-sm text-center px-2">{cat.name}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Custom CSS for 3D perspective */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
};

export default CategoryBanners3D;
