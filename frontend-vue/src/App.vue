<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans">
    <!-- Navigation Bar -->
    <Navbar @auth-success="fetchData" />

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
          v-if="isLoggedIn"
          @click="showCheckInModal = true"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-5 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 w-full sm:w-auto"
        >
          <Plus class="h-4.5 w-4.5" /> Log New Visit
        </button>
        <span
          v-else
          class="inline-flex items-center justify-center text-xs font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-5 py-3 rounded-xl cursor-default"
        >
          🔑 Sign In to Stamp Passport
        </span>
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
        <!-- Dashboard Authenticated blocks -->
        <div v-if="isLoggedIn" class="space-y-8">
          <!-- Stats Overview Cards -->
          <StatsOverview :stats="stats" />

          <!-- Trip Planner & Route Visualizer -->
          <TripPlanner
            :check-ins="checkIns"
            :breweries="breweries"
            :selected-trip-name="selectedTripName"
            @select-trip="handleSelectTrip"
            @trip-created="fetchData"
            @add-stop="handlePlanStop"
          />
        </div>

        <!-- Locked Authentication Prompt overlay -->
        <div v-else class="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-850 dark:bg-slate-900/40 text-center space-y-3 max-w-xl mx-auto shadow-sm">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Lock class="h-5 w-5" />
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-950 dark:text-white">Passport Vault Locked</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Personalized metrics, maps, journey timelines, and trip logs require profile authorization. Please sign in or create an account to activate your passport.
            </p>
          </div>
        </div>

        <!-- Advanced Filter Controls (Always Public) -->
        <FilterBar :breweries="breweries" @filter-change="handleFilterChange" />

        <!-- Split Panel: Maps/Venues and Timeline Feed -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <!-- Left/Center Map Visualizer Section (2 cols) -->
          <div class="xl:col-span-2 space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                🗺️ Location Explorer
              </h2>
            </div>
            <BreweryMap
              :breweries="filteredBreweries"
              :check-ins="checkIns"
              :selected-trip-name="selectedTripName"
            />
          </div>

          <!-- Right Timeline Section (1 col - Authenticated view) -->
          <div class="xl:col-span-1 space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                📜 Visited Venues
              </h2>
            </div>
            <CheckInList v-if="isLoggedIn" :checkIns="checkIns" :breweries="breweries" @success="fetchData" />
            <div v-else class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900/40 text-center py-12 text-xs text-slate-400">
              🔒 Sign In to view recent visits
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Check-In Modal overlay form -->
    <LogVisitModal
      v-slot:default
      v-if="showCheckInModal"
      :breweries="breweries"
      :trips="trips"
      :initial-trip-name="selectedInitialTripName"
      :initial-brewery-id="selectedInitialBreweryId"
      @close="handleCheckInClose"
      @success="handleCheckInSuccess"
    />

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-950 transition-colors duration-300 mt-12 text-xs text-slate-400 text-center">
      <p>© 2026 BrewsTraveller. Open Source dual-backend portfolio showcase.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Plus, AlertCircle, RefreshCw, Lock } from '@lucide/vue';
import api, { activeBackend, apiBaseUrl } from '@/services/api';
import type { Brewery, CheckIn, UserStats, Trip } from '@/types';
import { useAuth } from '@/composables/useAuth';

// Components
import Navbar from '@/components/Navbar.vue';
import StatsOverview from '@/components/StatsOverview.vue';
import CheckInList from '@/components/CheckInList.vue';
import BreweryMap from '@/components/BreweryMap.vue';
import LogVisitModal from '@/components/LogVisitModal.vue';
import FilterBar from '@/components/FilterBar.vue';
import TripPlanner from '@/components/TripPlanner.vue';

// Auth State
const { isLoggedIn } = useAuth();

// State
const loading = ref(true);
const error = ref(false);
const showCheckInModal = ref(false);
const selectedTripName = ref<string | null>(null);

const breweries = ref<Brewery[]>([]);
const checkIns = ref<CheckIn[]>([]);
const trips = ref<Trip[]>([]);
const stats = ref<UserStats>({
  total_breweries: 0,
  total_miles: 0,
  total_tours: 0,
  states_visited_count: 0,
  states_visited: [],
  state_list: []
});

// Filtering state
const activeFilters = ref({
  search: '',
  state: '',
  rating: 0,
  amenities: [] as string[]
});

const selectedInitialTripName = ref<string | null>(null);
const selectedInitialBreweryId = ref<string | null>(null);

function handleFilterChange(newFilters: typeof activeFilters.value) {
  activeFilters.value = newFilters;
}

function handleSelectTrip(tripName: string | null) {
  selectedTripName.value = tripName;
}

function handlePlanStop(breweryId: string, tripName: string) {
  selectedInitialBreweryId.value = breweryId;
  selectedInitialTripName.value = tripName;
  showCheckInModal.value = true;
}

function handleCheckInClose() {
  selectedInitialBreweryId.value = null;
  selectedInitialTripName.value = null;
  showCheckInModal.value = false;
}

// Compute filtered list of breweries based on active search, state, rating, and amenity criteria
const filteredBreweries = computed(() => {
  return breweries.value.filter((b) => {
    // 1. Search term match (name, city, state)
    if (activeFilters.value.search) {
      const sLower = activeFilters.value.search.toLowerCase();
      const matchesSearch =
        b.name.toLowerCase().includes(sLower) ||
        b.city.toLowerCase().includes(sLower) ||
        b.state.toLowerCase().includes(sLower);
      if (!matchesSearch) return false;
    }

    // 2. US State match
    if (activeFilters.value.state) {
      if (b.state.toUpperCase() !== activeFilters.value.state.toUpperCase()) {
        return false;
      }
    }

    // 3. Minimum rating match
    if (activeFilters.value.rating > 0) {
      const breweryCheckins = checkIns.value.filter((c) => c.brewery_id === b.id);
      if (breweryCheckins.length === 0) return false;
      const avg = breweryCheckins.reduce((sum, c) => sum + c.rating, 0) / breweryCheckins.length;
      if (avg < activeFilters.value.rating) return false;
    }

    // 4. Observed amenities match
    if (activeFilters.value.amenities.length > 0) {
      const breweryCheckins = checkIns.value.filter((c) => c.brewery_id === b.id);
      const observed = new Set<string>();
      breweryCheckins.forEach((c) => {
        if (c.amenities_observed) {
          c.amenities_observed.forEach((a) => observed.add(a));
        }
      });
      const matchesAll = activeFilters.value.amenities.every((a) => observed.has(a));
      if (!matchesAll) return false;
    }

    return true;
  });
});

async function fetchData() {
  loading.value = true;
  error.value = false;

  // 1. Fetch Breweries (Public Endpoint)
  try {
    const breweriesRes = await api.get('/breweries');
    breweries.value = breweriesRes.data;
  } catch (err) {
    console.error('Failed to load breweries:', err);
    error.value = true;
  }

  // Fetch private details only if authenticated (isolated try-catches)
  if (isLoggedIn.value) {
    // 2. Fetch Check-ins
    try {
      const checkInsRes = await api.get('/checkins');
      checkIns.value = checkInsRes.data;
    } catch (err) {
      console.error('Failed to load check-ins timeline:', err);
      checkIns.value = [];
    }

    // 3. Fetch Stats
    try {
      const statsRes = await api.get('/stats');
      stats.value = statsRes.data;
    } catch (err) {
      console.error('Failed to load stats dashboard:', err);
    }

    // 4. Fetch Trips (Decoupled Itineraries)
    try {
      const tripsRes = await api.get('/trips');
      trips.value = tripsRes.data;
    } catch (err) {
      console.error('Failed to load trips itineraries:', err);
      trips.value = [];
    }
  } else {
    // Reset authenticated collections
    checkIns.value = [];
    trips.value = [];
    stats.value = {
      total_breweries: 0,
      total_miles: 0,
      total_tours: 0,
      states_visited_count: 0,
      states_visited: [],
      state_list: []
    };
  }

  loading.value = false;
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
