import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA auto-updates
registerSW({ immediate: true });

createApp(App).mount('#app');
