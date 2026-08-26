<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans">
    <!-- Navigation Bar -->
    <Navbar />

    <!-- Main Content Area -->
    <main class="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      <!-- Dashboard Subheader & Action Button -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            🧭 My Brews Passport
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking brewery check-ins, travel miles, behind-the-scenes tours, and crowd-sourced amenities.
          </p>
        </div>
        <button
          @click="showCheckInModal = true"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-5 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 w-full sm:w-auto"
        >
          <Plus class="h-4.5 w-4.5" /> Log New Visit
        </button>
      </div>

      <!-- Loading State Overlay -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <span class="h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
        <div class="text-center">
          <p class="text-sm font-bold text-slate-800 dark:text-slate-200">Synchronizing Passport Data...</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Querying {{ activeBackend === 'node' ? 'Node.js Express' : 'Python FastAPI' }} backend aggregates</p>
        </div>
      </div>

      <!-- Error State (e.g. backend is offline) -->
      <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 dark:border-rose-950/40 dark:bg-rose-950/10 text-center space-y-4">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
          <AlertCircle class="h-6 w-6" />
        </div>
        <div class="max-w-md mx-auto space-y-1">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Backend Server Unreachable</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            We are unable to connect to the active API base URL <code class="font-mono bg-rose-100/50 dark:bg-slate-900 px-1 py-0.5 rounded text-rose-800 dark:text-rose-300 text-[11px]">{{ apiBaseUrl }}</code>.
          </p>
          <p class="text-xs text-slate-400 dark:text-slate-500">
            Make sure your {{ activeBackend === 'node' ? 'Node.js (port 5000)' : 'Python FastAPI (port 8000)' }} server is running locally and connected to MongoDB.
          </p>
        </div>
        <button
          @click="fetchData"
          class="inline-flex items-center gap-1 px-4 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 rounded-xl text-xs font-bold text-rose-800 dark:text-rose-300"
        >
          <RefreshCw class="h-3.5 w-3.5" /> Try Reconnecting
        </button>
      </div>

      <!-- Main Dashboard Grid -->
      <div v-else class="space-y-8 animate-fade-in">
        <!-- Stats Overview Cards -->
        <StatsOverview :stats="stats" />

        <!-- Split Panel: Maps/Venues and Timeline Feed -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <!-- Left/Center Map Visualizer Section (2 cols) -->
          <div class="xl:col-span-2 space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                🗺️ Location Explorer
              </h2>
            </div>
            <BreweryMap :breweries="breweries" />
          </div>

          <!-- Right Timeline Section (1 col) -->
          <div class="xl:col-span-1 space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                📜 Visited Venues
              </h2>
            </div>
            <CheckInList :checkIns="checkIns" :breweries="breweries" />
          </div>
        </div>
      </div>
    </main>

    <!-- Check-In Modal overlay form -->
    <CheckInForm
      v-if="showCheckInModal"
      :breweries="breweries"
      @close="showCheckInModal = false"
      @success="handleCheckInSuccess"
    />

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-950 transition-colors duration-300 mt-12 text-xs text-slate-400 text-center">
      <p>© 2026 BrewsTraveller. Open Source dual-backend portfolio showcase.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Plus, AlertCircle, RefreshCw } from 'lucide-vue-next';
import api, { activeBackend, apiBaseUrl } from '@/services/api';
import type { Brewery, CheckIn, UserStats } from '@/types';

// Components
import Navbar from '@/components/Navbar.vue';
import StatsOverview from '@/components/StatsOverview.vue';
import CheckInList from '@/components/CheckInList.vue';
import BreweryMap from '@/components/BreweryMap.vue';
import CheckInForm from '@/components/CheckInForm.vue';

// Constants
const USER_ID = 'default_passport_user';

// State
const loading = ref(true);
const error = ref(false);
const showCheckInModal = ref(false);

const breweries = ref<Brewery[]>([]);
const checkIns = ref<CheckIn[]>([]);
const stats = ref<UserStats>({
  total_breweries: 0,
  total_miles: 0,
  total_tours: 0,
  states_visited_count: 0,
  states_visited: [],
  state_list: []
});

async function fetchData() {
  loading.value = true;
  error.value = false;

  try {
    // 1. Fetch Breweries
    const breweriesRes = await api.get('/breweries');
    breweries.value = breweriesRes.data;

    // 2. Fetch Check-ins
    const checkInsRes = await api.get('/checkins', {
      params: { user_id: USER_ID }
    });
    checkIns.value = checkInsRes.data;

    // 3. Fetch Stats
    const statsRes = await api.get('/stats', {
      params: { user_id: USER_ID }
    });
    stats.value = statsRes.data;
  } catch (err) {
    console.error('Failed to sync passport data:', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

// Watch global backend URL switch and automatically reload data on change!
watch(activeBackend, () => {
  fetchData();
});

function handleCheckInSuccess() {
  showCheckInModal.value = false;
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>

<style>
/* Smooth fade-in animation for active state components */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
