// src/utils/api.js
const API_BASE_URL = 'http://localhost:5000';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    console.log('API Call:', url, config); // Debug log
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log('API Response:', response.status, data); // Debug log
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  verify: () => apiCall('/auth/verify'),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Appointments API - FIXED ROUTES
export const appointmentsAPI = {
  create: (appointmentData) => apiCall('/api/appointments', {  // ✅ Added /api/
    method: 'POST',
    body: JSON.stringify(appointmentData),
  }),
  
  getAll: () => apiCall('/api/appointments'),  // ✅ Added /api/
  
  getById: (id) => apiCall(`/api/appointments/${id}`),  // ✅ Added /api/
  
  update: (id, data) => apiCall(`/api/appointments/${id}`, {  // ✅ Added /api/
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiCall(`/api/appointments/${id}`, {  // ✅ Added /api/
    method: 'DELETE',
  }),
};

// Contact API - FIXED ROUTES
export const contactAPI = {
  send: (messageData) => apiCall('/api/contact', {  // ✅ Added /api/
    method: 'POST',
    body: JSON.stringify(messageData),
  }),
  
  getAll: () => apiCall('/api/contact'),  // ✅ Added /api/
  
  getById: (id) => apiCall(`/api/contact/${id}`),  // ✅ Added /api/
  
  updateStatus: (id, status) => apiCall(`/api/contact/${id}`, {  // ✅ Added /api/
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  
  delete: (id) => apiCall(`/api/contact/${id}`, {  // ✅ Added /api/
    method: 'DELETE',
  }),
};

// Projects API
export const projectsAPI = {
  getAll: () => apiCall('/projects'),
  
  create: (projectData) => apiCall('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  }),
  
  update: (id, projectData) => apiCall(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(projectData),
  }),
  
  delete: (id) => apiCall(`/projects/${id}`, {
    method: 'DELETE',
  }),
};

// Room Analysis API
export const roomAnalysisAPI = {
  // Upload and analyze room image
  analyze: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token = getAuthToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE_URL}/api/room-analysis/upload`, {
        method: 'POST',
        headers,
        body: formData // Don't set Content-Type for FormData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Analysis failed');
      }
      
      return data;
    } catch (error) {
      console.error('Error analyzing room:', error);
      throw error;
    }
  },

  // Get analysis by ID
  getById: (id) => apiCall(`/api/room-analysis/${id}`),

  // Get user's analyses
  getUserAnalyses: () => apiCall('/api/room-analysis/user'),
};

// Inspiration API
export const inspirationAPI = {
  // Get inspiration images
  getImages: async (roomType, style, count = 9) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/inspiration/${roomType}/${style}?count=${count}`
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch inspiration');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching inspiration:', error);
      throw error;
    }
  }
};

// Test API connection
export const testAPI = {
  ping: () => apiCall('/api/test'),
};

export default {
  authAPI,
  appointmentsAPI,
  contactAPI,
  projectsAPI,
  roomAnalysisAPI,
  inspirationAPI,
  testAPI
};