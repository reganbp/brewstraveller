import axios from 'axios';
import { ref, computed } from 'vue';

export type BackendType = 'node' | 'python';

const IS_PROD = import.meta.env.PROD;

export const BACKEND_URLS: Record<BackendType, string> = {
  node: IS_PROD 
    ? 'https://brewstraveller-node-api.onrender.com' 
    : 'http://localhost:5000',
  python: IS_PROD 
    ? 'https://brewstraveller-python-api.onrender.com' 
    : 'http://localhost:8000',
};

const initialBackend: BackendType = (localStorage.getItem('active_backend') as BackendType) || 'node';
export const activeBackend = ref<BackendType>(initialBackend);
export const latency = ref<number | null>(null);

export const apiBaseUrl = computed(() => BACKEND_URLS[activeBackend.value]);

export const api = axios.create({
  baseURL: BACKEND_URLS[activeBackend.value],
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  (config as any).metadata = { startTime: new Date().getTime() };
  
  const token = localStorage.getItem('bt_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    const startTime = (response.config as any).metadata?.startTime;
    if (startTime) {
      latency.value = new Date().getTime() - startTime;
    }
    return response;
  },
  (error) => {
    const startTime = (error.config as any)?.metadata?.startTime;
    if (startTime) {
      latency.value = new Date().getTime() - startTime;
    }
    return Promise.reject(error);
  }
);

export function setBackend(backend: BackendType): void {
  activeBackend.value = backend;
  localStorage.setItem('active_backend', backend);
  api.defaults.baseURL = BACKEND_URLS[backend];
}

export function getActiveBackend(): BackendType {
  return activeBackend.value;
}

export default api;
