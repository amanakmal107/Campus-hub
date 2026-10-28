const getApiBase = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:5000/api`;
};

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:5000${path}`;
};

class ApiService {
  constructor() {
    this.getBaseURL = getApiBase;
  }

  getToken() {
    return localStorage.getItem('campushub_token');
  }

  getRefreshToken() {
    return localStorage.getItem('campushub_refresh_token');
  }

  setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem('campushub_token', accessToken);
    if (refreshToken) localStorage.setItem('campushub_refresh_token', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('campushub_token');
    localStorage.removeItem('campushub_refresh_token');
    localStorage.removeItem('campushub_user');
  }

  async request(endpoint, options = {}) {
    const url = `${this.getBaseURL()}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...options.headers,
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      let response = await fetch(url, { ...options, headers });

      // Handle token expiration: attempt refresh once
      if (response.status === 401 && this.getRefreshToken() && !options._isRetry) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          options._isRetry = true;
          headers['Authorization'] = `Bearer ${this.getToken()}`;
          response = await fetch(url, { ...options, headers });
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.error || 'Something went wrong');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const res = await fetch(`${this.getBaseURL()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const data = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  get(endpoint, params) {
    let query = '';
    if (params) {
      const filtered = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '');
      if (filtered.length) {
        query = '?' + new URLSearchParams(filtered).toString();
      }
    }
    return this.request(`${endpoint}${query}`, { method: 'GET' });
  }

  post(endpoint, body) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
