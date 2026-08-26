<template>
  <header class="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 transition-colors duration-300">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Logo / Brand -->
      <div class="flex items-center gap-2">
        <Beer class="h-7 w-7 text-amber-500 fill-amber-500 animate-pulse" />
        <span class="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
          BrewsTraveller
        </span>
        <span class="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          Portfolio Passport
        </span>
      </div>

      <!-- Controls & Latency Badge -->
      <div class="flex items-center gap-4">
        <!-- Latency Monitor -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Zap :class="['h-3.5 w-3.5', latencyColor]" />
          <span class="text-slate-500 dark:text-slate-400 capitalize hidden xs:inline">
            {{ activeBackend === 'node' ? 'Node.js' : 'FastAPI' }}:
          </span>
          <span v-if="latency !== null" :class="latencyTextColor">
            {{ latency }}ms
          </span>
          <span v-else class="text-slate-400 dark:text-slate-500 animate-pulse">
            offline
          </span>
        </div>

        <!-- Backend Toggle Switch -->
        <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            @click="activeBackend = 'node'"
            :class="[
              'px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200',
              activeBackend === 'node'
                ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            Node
          </button>
          <button
            @click="activeBackend = 'python'"
            :class="[
              'px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200',
              activeBackend === 'python'
                ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            Python
          </button>
        </div>

        <!-- Dark/Light Toggle -->
        <button
          @click="toggleTheme"
          class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
          title="Toggle color theme"
        >
          <Sun v-if="isDark" class="h-4.5 w-4.5" />
          <Moon v-else class="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Beer, Zap, Sun, Moon } from 'lucide-vue-next';
import api, { activeBackend, latency } from '@/services/api';

const isDark = ref(true);

function toggleTheme() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}

// Compute colors based on response latency
const latencyColor = computed(() => {
  if (latency.value === null) return 'text-slate-400 dark:text-slate-600';
  if (latency.value < 50) return 'text-emerald-500 fill-emerald-500/20';
  if (latency.value < 150) return 'text-amber-500 fill-amber-500/20';
  return 'text-rose-500 fill-rose-500/20';
});

const latencyTextColor = computed(() => {
  if (latency.value === null) return 'text-slate-400';
  if (latency.value < 50) return 'text-emerald-600 dark:text-emerald-400 font-bold';
  if (latency.value < 150) return 'text-amber-600 dark:text-amber-400 font-semibold';
  return 'text-rose-600 dark:text-rose-400 font-bold animate-pulse';
});

// Periodic ping loop to keep latency monitor updated
let pingInterval: number | null = null;

async function pingBackend() {
  try {
    await api.get('/health');
  } catch (err) {
    console.warn('Backend is currently offline or unreachable.');
    latency.value = null;
  }
}

onMounted(() => {
  // Sync theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    isDark.value = false;
    document.documentElement.classList.remove('dark');
  } else {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }

  // Set up ping interval
  pingBackend();
  pingInterval = window.setInterval(pingBackend, 10000);
});

onUnmounted(() => {
  if (pingInterval) {
    clearInterval(pingInterval);
  }
});
</script>
