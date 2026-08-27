<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors duration-300 space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
      <div class="flex items-center gap-2">
        <SlidersHorizontal class="h-5 w-5 text-amber-500" />
        <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Filter & Search Venues</h3>
      </div>
      <button
        type="button"
        @click="clearFilters"
        class="inline-flex items-center gap-1.5 h-11 text-xs font-bold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
      >
        <RotateCcw class="h-3.5 w-3.5" /> Reset Filters
      </button>
    </div>

    <!-- Responsive Grid for Desktop, Tablet, and Mobile -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Search Input -->
      <div class="space-y-1.5">
        <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Search Brewery, City, or State
        </label>
        <div class="relative">
          <input
            v-model="filters.search"
            @input="emitFilters"
            placeholder="e.g. Russian River..."
            class="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-amber-500 focus:outline-none dark:text-white"
          />
          <Search class="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      <!-- State Dropdown -->
      <div class="space-y-1.5">
        <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          US State Filter
        </label>
        <select
          v-model="filters.state"
          @change="emitFilters"
          class="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-amber-500 focus:outline-none dark:text-white"
        >
          <option value="">All States</option>
          <option v-for="st in uniqueStates" :key="st" :value="st">
            {{ st }}
          </option>
        </select>
      </div>

      <!-- Minimum Rating Filter -->
      <div class="space-y-1.5 sm:col-span-2 lg:col-span-1">
        <label class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Minimum Rating (Stars)
        </label>
        <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 h-11 text-sm">
          <input
            v-model.number="filters.rating"
            type="range"
            min="0"
            max="5"
            step="1"
            @input="emitFilters"
            class="w-full accent-amber-500 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
          <span class="flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400 min-w-[3.5rem] justify-end">
            <Star class="h-3.5 w-3.5 fill-amber-400" />
            {{ filters.rating > 0 ? `${filters.rating}.0+` : 'Any' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Crowdsourced Amenities pills (Horizontal scrolling on mobile) -->
    <div class="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800/80">
      <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        Filter by Crowd-Sourced Amenities
      </span>
      <div class="flex overflow-x-auto pb-2 scrollbar-none sm:flex-wrap gap-2 -mx-6 px-6 sm:mx-0 sm:px-0">
        <button
          v-for="amenity in AMENITY_OPTIONS"
          :key="amenity.slug"
          type="button"
          @click="toggleAmenity(amenity.slug)"
          :class="[
            'px-4 py-2.5 h-11 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap flex items-center justify-center min-w-[100px]',
            filters.amenities.includes(amenity.slug)
              ? 'bg-amber-500 border-amber-500 text-white shadow dark:bg-amber-600 dark:border-amber-600'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
          ]"
        >
          {{ amenity.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { SlidersHorizontal, Search, Star, RotateCcw } from 'lucide-vue-next';
import type { Brewery } from '@/types';

// Props
const props = defineProps<{
  breweries: Brewery[];
}>();

// Emits
const emit = defineEmits<{
  (e: 'filter-change', filters: { search: string; state: string; rating: number; amenities: string[] }): void;
}>();

// Amenity Options to toggle
const AMENITY_OPTIONS = [
  { slug: 'dog_friendly', label: '🐶 Dog Friendly' },
  { slug: 'outdoor_patio', label: '☀️ Outdoor Patio' },
  { slug: 'food_trucks', label: '🚚 Food Trucks' },
  { slug: 'serves_food', label: '🍔 Serves Food' },
  { slug: 'live_music', label: '🎸 Live Music' },
  { slug: 'kid_friendly', label: '👶 Kid Friendly' },
  { slug: 'scenic_views', label: '🏔️ Scenic Views' }
];

// Local Filter state
const filters = reactive({
  search: '',
  state: '',
  rating: 0,
  amenities: [] as string[]
});

// Dynamically extract unique states for the dropdown filter
const uniqueStates = computed(() => {
  const states = props.breweries
    .map((b) => b.state)
    .filter((s) => s && s.length === 2)
    .map((s) => s.toUpperCase());
  return [...new Set(states)].sort();
});

function toggleAmenity(slug: string) {
  if (filters.amenities.includes(slug)) {
    filters.amenities = filters.amenities.filter((a) => a !== slug);
  } else {
    filters.amenities.push(slug);
  }
  emitFilters();
}

function clearFilters() {
  filters.search = '';
  filters.state = '';
  filters.rating = 0;
  filters.amenities = [];
  emitFilters();
}

function emitFilters() {
  emit('filter-change', { ...filters });
}
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-none {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
