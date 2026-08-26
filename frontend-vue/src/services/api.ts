import axios from 'axios';
import { ref, watch } from 'vue';

export type BackendType = 'node' | 'python';

const DEFAULT_BACKENDS: Record<BackendType, string> = {
  node: 'http://localhost:5000',
  python: 'http://localhost:8000'
};

const storedBackend = localStorage.getItem('bt_backend') as BackendType | null;
const initialBackend: BackendType = storedBackend || 'node';

export const activeBackend = ref<BackendType>(initialBackend);
export const apiBaseUrl = ref<string>(localStorage.getItem('bt_api_url') || DEFAULT_BACKENDS[initialBackend]);
export const latency = ref<number | null>(null);

watch(activeBackend, (newVal) => {
  localStorage.setItem('bt_backend', newVal);
  apiBaseUrl.value = DEFAULT_BACKENDS[newVal];
  localStorage.setItem('bt_api_url', DEFAULT_BACKENDS[newVal]);
});

const api = axios.create();

// Dynamically set active backend URL before every request
api.interceptors.request.use((config) => {
  config.baseURL = apiBaseUrl.value;
  config.metadata = { startTime: Date.now() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      latency.value = Date.now() - startTime;
    }
    return response;
  },
  (error) => {
    const startTime = error.config?.metadata?.startTime;
    if (startTime) {
      latency.value = Date.now() - startTime;
    }
    return Promise.reject(error);
  }
);

// Extend AxiosRequestConfig so TS compiler allows custom metadata properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

export default api;
