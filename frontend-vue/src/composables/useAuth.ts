import { ref, computed } from 'vue';
import api from '@/services/api';
import type { User } from '@/types';

const token = ref<string | null>(localStorage.getItem('bt_token'));
const user = ref<User | null>(null);

// Try to parse user from local storage
const savedUser = localStorage.getItem('bt_user');
if (savedUser) {
  try {
    user.value = JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('bt_user');
  }
}

// Decentralized helper to parse JWT payload without external libraries
function parseJwt(tokenStr: string) {
  try {
    const base64Url = tokenStr.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Auth Session Persistence & Rehydration Check (Runs on startup/refresh)
if (token.value) {
  const payload = parseJwt(token.value);
  if (payload && payload.exp) {
    const currentTime = Date.now() / 1000;
    if (payload.exp < currentTime) {
      console.warn('Authentication session expired. Clearing local session state.');
      token.value = null;
      user.value = null;
      localStorage.removeItem('bt_token');
      localStorage.removeItem('bt_user');
    }
  } else {
    // Invalid token, wipe session completely to prevent stuck states
    console.warn('Invalid token detected. Clearing local session state.');
    token.value = null;
    user.value = null;
    localStorage.removeItem('bt_token');
    localStorage.removeItem('bt_user');
  }
}

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value);

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    token.value = res.data.access_token;
    user.value = res.data.user;
    localStorage.setItem('bt_token', res.data.access_token);
    localStorage.setItem('bt_user', JSON.stringify(res.data.user));
  }

  async function register(email: string, password: string, full_name: string) {
    const res = await api.post('/auth/register', { email, password, full_name });
    token.value = res.data.access_token;
    user.value = res.data.user;
    localStorage.setItem('bt_token', res.data.access_token);
    localStorage.setItem('bt_user', JSON.stringify(res.data.user));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('bt_token');
    localStorage.removeItem('bt_user');
    window.location.reload(); // Reload to clear memory states and reset
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    logout
  };
}
