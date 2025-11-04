// API Configuration - works in both dev and production
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// For development: VITE_API_URL=http://localhost:5000/api
// For production: uses /api (proxied by nginx)
