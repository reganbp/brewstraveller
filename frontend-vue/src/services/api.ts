import axios from 'axios';

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

let activeBackend: BackendType = (localStorage.getItem('active_backend') as BackendType) || 'node';

export const api = axios.create({
  baseURL: BACKEND_URLS[activeBackend],
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setBackend(backend: BackendType): void {
  activeBackend = backend;
  localStorage.setItem('active_backend', backend);
  api.defaults.baseURL = BACKEND_URLS[backend];
}

export function getActiveBackend(): BackendType {
  return activeBackend;
}
