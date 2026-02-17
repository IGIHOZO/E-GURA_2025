import React, { useRef, useEffect, useState, memo } from 'react';

/**
 * ProductMedia Component - OPTIMIZED VERSION
 * Handles images with lazy loading, proper sizing, and NO Base64 support
 * Videos only supported via URL (not base64)
 */
const ProductMedia = memo(({ 
  src, 
  alt, 
  className = '', 
  autoPlay = false,
  muted = true,
  loop = true,
  controls = false,
  poster = null,
  generateThumbnail = false, // Disabled by default for performance
  playOnHover = false, // Disabled by default for performance
  fallbackSrc = 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
  loading = 'lazy', // Native lazy loading
  sizes = 'medium', // thumb, medium, large
  onLoad = null,
  onError = null
}) => {
  const videoRef = useRef(null);
  const [videoThumbnail, setVideoThumbnail] = useState(poster);
  const [isHovering, setIsHovering] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check if URL is a video based on extension
  const isVideo = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.m4v'];
    const urlLower = url.toLowerCase();
    return videoExtensions.some(ext => urlLower.includes(ext));
  };

  // Check if it's a base64 string (should be avoided)
  const isBase64 = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('data:');
  };

  // Get optimized image URL based on size
  const getOptimizedSrc = (url) => {
    if (!url || isBase64(url)) return url;
    
    // If URL contains size path, swap to requested size
    if (url.includes('/uploads/products/')) {
      const sizeMap = { thumb: 'thumb', medium: 'medium', large: 'large' };
      const targetSize = sizeMap[sizes] || 'medium';
      
      // Replace size in path if present
      return url.replace(/\/(thumb|medium|large|original)\//, `/${targetSize}/`);
    }
    
    return url;
  };

  const optimizedSrc = getOptimizedSrc(src);
  const mediaIsVideo = isVideo(src);

  // Generate thumbnail from video
  useEffect(() => {
    if (mediaIsVideo && generateThumbnail && !poster && !hasGenerated && videoRef.current) {
      const video = videoRef.current;
      
      // Wait for video metadata to load
      const generateThumb = () => {
        try {
          // Seek to 1 second or 10% of video duration
          const seekTime = Math.min(1, video.duration * 0.1);
          video.currentTime = seekTime;
          
          // Create canvas to capture frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to base64 image
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          setVideoThumbnail(thumbnailUrl);
          setHasGenerated(true);
          
          // Reset video to start
          video.currentTime = 0;
        } catch (error) {
          console.error('Error generating thumbnail:', error);
        }
      };

      video.addEventListener('loadedmetadata', generateThumb);
      video.addEventListener('seeked', () => {
        if (!hasGenerated) {
          generateThumb();
        }
      });

      return () => {
        video.removeEventListener('loadedmetadata', generateThumb);
      };
    }
  }, [mediaIsVideo, generateThumbnail, poster, hasGenerated]);

  // Handle hover play/pause
  useEffect(() => {
    if (mediaIsVideo && playOnHover && videoRef.current) {
      const video = videoRef.current;
      
      if (isHovering && !controls) {
        video.play().catch(err => console.log('Video play failed:', err));
      } else if (!isHovering && !autoPlay && !controls) {
        video.pause();
        video.currentTime = 0; // Reset to start
      }
    }
  }, [isHovering, mediaIsVideo, playOnHover, autoPlay, controls]);

  if (mediaIsVideo) {
    return (
      <div 
        className="relative w-full h-full"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <video
          ref={videoRef}
          src={src}
          className={className}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline
          preload={generateThumbnail ? "metadata" : "auto"}
          poster={videoThumbnail || poster || undefined}
          onError={(e) => {
            // If video fails to load, replace with fallback image
            e.target.style.display = 'none';
            const img = document.createElement('img');
            img.src = fallbackSrc;
            img.className = className;
            img.alt = alt;
            e.target.parentNode.replaceChild(img, e.target);
          }}
        >
          Your browser does not support video playback.
        </video>
        
        {/* Play icon overlay for videos without autoplay */}
        {!autoPlay && !controls && !isHovering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
              <svg 
                className="w-8 h-8 text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Get thumbnail URL for blur-up placeholder
  const getThumbSrc = (url) => {
    if (!url || isBase64(url)) return null;
    if (url.includes('/uploads/products/')) {
      return url.replace(/\/(thumb|medium|large|original)\//, '/thumb/');
    }
    return null;
  };

  const thumbSrc = getThumbSrc(src);

  // Handle image load
  const handleImageLoad = (e) => {
    setImageLoaded(true);
    if (onLoad) onLoad(e);
  };

  // Handle image error
  const handleImageError = (e) => {
    setHasError(true);
    e.target.src = fallbackSrc;
    if (onError) onError(e);
  };

  // Warn about base64 images in development
  if (isBase64(src) && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ ProductMedia: Base64 image detected. Consider migrating to file uploads.', src?.substring(0, 50));
  }

  return (
    <div className="relative overflow-hidden bg-gray-100">
      {/* Shimmer skeleton — visible until image loads */}
      {!imageLoaded && !hasError && (
        <div className="absolute inset-0 z-10">
          <div className="absolute inset-0 bg-gray-200" />
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      )}

      {/* Tiny blurred thumbnail for instant preview (blur-up) */}
      {thumbSrc && !imageLoaded && !hasError && (
        <img
          src={thumbSrc}
          alt=""
          aria-hidden="true"
          className={`${className} absolute inset-0 w-full h-full object-cover scale-105 blur-md z-[5]`}
        />
      )}

      {/* Full-resolution image */}
      <img
        src={optimizedSrc || fallbackSrc}
        alt={alt}
        className={`${className} transition-opacity duration-500 ease-out ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={loading}
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
});

// Display name for debugging
ProductMedia.displayName = 'ProductMedia';

export default ProductMedia;
