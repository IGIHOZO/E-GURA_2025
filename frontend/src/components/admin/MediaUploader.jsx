import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

/**
 * Advanced Media Uploader Component
 * Supports images (JPG, PNG, WebP) and videos (MP4, AVI, WebM)
 * with automatic compression and progress tracking
 */
const MediaUploader = ({ 
  onUploadComplete, 
  maxFiles = 10,
  acceptImages = true,
  acceptVideos = true,
  productGallery = false
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [errors, setErrors] = useState([]);

  // Accepted file types
  const getAcceptedTypes = () => {
    const types = [];
    if (acceptImages) types.push('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif');
    if (acceptVideos) types.push('video/mp4', 'video/avi', 'video/webm', 'video/quicktime', 'video/x-msvideo');
    return types.join(',');
  };

  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (files.length + selectedFiles.length > maxFiles) {
      setErrors([`Maximum ${maxFiles} files allowed`]);
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setErrors(prev => [...prev, `${file.name}: File too large (max 50MB)`]);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    setErrors([]);
  }, [files, maxFiles]);

  // Handle drag and drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelect({ target: { files: droppedFiles } });
  }, [handleFileSelect]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Remove file from list
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors([]);
    const formData = new FormData();

    files.forEach(file => {
      formData.append('media', file);
    });

    try {
      const endpoint = productGallery 
        ? '/api/media/upload/product-gallery'
        : files.length > 1 
          ? '/api/media/upload/multiple'
          : '/api/media/upload/single';

      const response = await axios.post(`http://localhost:5000${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress({ overall: percentCompleted });
        }
      });

      if (response.data.success) {
        setUploadedMedia(response.data.data);
        if (onUploadComplete) {
          onUploadComplete(response.data.data);
        }
        
        // Clear files after successful upload
        setTimeout(() => {
          setFiles([]);
          setUploadedMedia([]);
          setProgress({});
        }, 3000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors([error.response?.data?.message || 'Upload failed. Please try again.']);
    } finally {
      setUploading(false);
    }
  };

  // Get file type icon
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="w-8 h-8 text-blue-500" />;
    } else if (file.type.startsWith('video/')) {
      return <VideoCameraIcon className="w-8 h-8 text-purple-500" />;
    }
    return <PhotoIcon className="w-8 h-8 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer bg-gray-50 hover:bg-purple-50"
      >
        <input
          type="file"
          multiple
          accept={getAcceptedTypes()}
          onChange={handleFileSelect}
          className="hidden"
          id="media-upload"
          disabled={uploading}
        />
        <label htmlFor="media-upload" className="cursor-pointer">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              {acceptImages && (
                <PhotoIcon className="w-12 h-12 text-gray-400" />
              )}
              {acceptVideos && (
                <VideoCameraIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {acceptImages && acceptVideos && 'Images & Videos'}
                {acceptImages && !acceptVideos && 'Images only'}
                {!acceptImages && acceptVideos && 'Videos only'}
                {' • '}
                Max {maxFiles} files • 50MB per file
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supported: JPG, PNG, WebP, GIF, MP4, AVI, WebM
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center text-red-700 text-sm">
              <ExclamationCircleIcon className="w-5 h-5 mr-2" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Selected Files ({files.length}/{maxFiles})
          </h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading... {progress.overall}%</span>
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-5 h-5" />
                <span>Upload {files.length} {files.length === 1 ? 'File' : 'Files'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Upload Success */}
      <AnimatePresence>
        {uploadedMedia && uploadedMedia.compressed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center text-green-700">
              <CheckCircleIcon className="w-6 h-6 mr-2" />
              <span className="font-medium">Upload successful!</span>
            </div>
            <p className="text-sm text-green-600 mt-2">
              Files compressed and optimized for fast loading
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">⚡ Automatic Optimization</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ Images converted to WebP format (70-80% smaller)</li>
          <li>✅ Videos compressed to MP4 H.264 (40-60% smaller)</li>
          <li>✅ Responsive image sizes generated automatically</li>
          <li>✅ Video thumbnails created automatically</li>
          <li>✅ Optimized for fastest loading speed</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaUploader;
