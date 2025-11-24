import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Use Vite proxy instead of hardcoded URL
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

<<<<<<< HEAD
export default api; 
=======
export default api; 
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
