import React, { useRef, useEffect, useState } from 'react';

/**
 * ProductMedia Component
 * Automatically detects if media is a video or image and renders appropriately
 * Supports video thumbnails, autoplay on hover, and smooth transitions
 */
const ProductMedia = ({ 
  src, 
  alt, 
  className = '', 
  autoPlay = false,
  muted = true,
  loop = true,
  controls = false,
  poster = null, // Custom poster/thumbnail image
  generateThumbnail = true, // Auto-generate thumbnail from video
  playOnHover = true, // Play video when hovering (for shop/homepage)
  fallbackSrc = 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop'
}) => {
  const videoRef = useRef(null);
  const [videoThumbnail, setVideoThumbnail] = useState(poster);
  const [isHovering, setIsHovering] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Check if URL is a video based on extension
  const isVideo = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.m4v'];
    const urlLower = url.toLowerCase();
    return videoExtensions.some(ext => urlLower.includes(ext));
  };

  // Check if it's a base64 video
  const isBase64Video = (url) => {
    if (!url) return false;
    return url.startsWith('data:video/');
  };

  const mediaIsVideo = isVideo(src) || isBase64Video(src);

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

  return (
    <img
      src={src || fallbackSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        e.target.src = fallbackSrc;
      }}
    />
  );
};

export default ProductMedia;
