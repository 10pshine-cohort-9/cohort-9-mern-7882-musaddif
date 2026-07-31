const API_BASE_URL = '/api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal, // Add abort signal
    });

    // Clear timeout since request completed
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    // Clear timeout if request fails
    clearTimeout(timeoutId);

    // Handle timeout specifically
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }

    throw error;
  }
};

export default apiFetch;