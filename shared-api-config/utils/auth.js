// 🔐 Authentication Utilities
// وظائف مساعدة للـ Token management

const TOKEN_KEY = 'triggerio_token';
const USER_KEY = 'triggerio_user';
const REFRESH_TOKEN_KEY = 'triggerio_refresh_token';

// ==========================================
// Token Management
// ==========================================

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const getToken = () => {
  // أولاً: جرب من URL params (للـ iframe navigation)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const rawToken = urlParams.get('token');
    if (rawToken) {
      const decoded = decodeURIComponent(rawToken);
      localStorage.setItem(TOKEN_KEY, decoded);
      return decoded;
    }
  } catch (e) {
    // ignore - SSR or no window
  }
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// ==========================================
// User Management
// ==========================================

export const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

// ==========================================
// Authentication Status
// ==========================================

export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

export const isTokenValid = () => {
  const token = getToken();

  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Invalid token format:', error);
    return false;
  }
};

export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = 'https://triggerio-auth.vercel.app/login';
};

// ==========================================
// Export all functions
// ==========================================

export default {
  setToken,
  getToken,
  removeToken,
  setRefreshToken,
  getRefreshToken,
  setUser,
  getUser,
  removeUser,
  isAuthenticated,
  isTokenValid,
  logout,
};
