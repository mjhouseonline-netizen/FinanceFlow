/**
 * Auth Utility Module
 * Handles authentication, token management, and API requests
 */

const API_BASE = 'https://financeflow-api-4mua.onrender.com';

const Auth = {
  // Token management
  getToken() {
    return localStorage.getItem('financeflow_token');
  },

  setToken(token) {
    localStorage.setItem('financeflow_token', token);
  },

  getUser() {
    const userStr = localStorage.getItem('financeflow_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user) {
    localStorage.setItem('financeflow_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('financeflow_token');
    localStorage.removeItem('financeflow_user');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Auth guard - redirects to login if not authenticated
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  // Logout
  logout() {
    this.clearAuth();
    window.location.href = '/login.html';
  },

  // API request helper with automatic auth headers
  async fetch(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // If 401, clear auth and redirect to login
    if (response.status === 401) {
      this.clearAuth();
      window.location.href = '/login.html';
      throw new Error('Unauthorized - please login again');
    }

    return response;
  },

  // Convenience methods for common HTTP verbs
  async get(endpoint) {
    return this.fetch(endpoint, { method: 'GET' });
  },

  async post(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async put(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(endpoint) {
    return this.fetch(endpoint, { method: 'DELETE' });
  }
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.Auth = Auth;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}
