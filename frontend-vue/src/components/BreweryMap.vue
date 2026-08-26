<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Brewery Directory (Left panel, 1 col) -->
    <div class="lg:col-span-1 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors duration-300 flex flex-col h-[550px]">
      <div class="border-b border-slate-200 px-4 py-3 dark:border-slate-800 flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Navigation class="h-4 w-4 text-amber-500" /> Brewery Directory
        </h3>
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {{ breweries.length }} registered
        </span>
      </div>

      <!-- Brewery List Scrollable -->
      <div class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        <button
          v-for="brewery in breweries"
          :key="brewery.id"
          @click="selectBrewery(brewery)"
          :class="[
            'w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex flex-col gap-1',
            selectedBrewery?.id === brewery.id ? 'bg-amber-500/5 border-l-4 border-amber-500 dark:bg-amber-500/10' : ''
          ]"
        >
          <div class="font-bold text-sm text-slate-900 dark:text-white truncate">
            {{ brewery.name }}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MapPin class="h-3 w-3" /> {{ brewery.city }}, {{ brewery.state }}
          </div>
          <div class="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">
            GPS: [{{ brewery.location.coordinates[0].toFixed(3) }}, {{ brewery.location.coordinates[1].toFixed(3) }}]
          </div>
        </button>

        <div v-if="breweries.length === 0" class="p-8 text-center text-slate-400 dark:text-slate-600 italic text-xs">
          No breweries found. Click "Log Visit" to register a new one.
        </div>
      </div>
    </div>

    <!-- Interactive Location Visualizer & Amenities (Right panels, 2 cols) -->
    <div class="lg:col-span-2 flex flex-col gap-6">
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors duration-300 flex-1 flex flex-col min-h-[550px]">
        <div v-if="selectedBrewery" class="space-y-6 flex-1 flex flex-col justify-between">
          
          <!-- Live Interactive Leaflet Map -->
          <div class="h-64 sm:h-72 w-full rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800 bg-slate-50">
            <InteractiveMap
              :breweries="breweries"
              :check-ins="checkIns"
              :selected-brewery-id="selectedBrewery?.id"
              :selected-trip-name="selectedTripName"
              @select-brewery="selectBrewery"
            />
          </div>

          <!-- Brewery Metadata details -->
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <span class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 mb-2">
                google_place_id: {{ selectedBrewery.google_place_id }}
              </span>
              <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">
                {{ selectedBrewery.name }}
              </h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Located in <strong class="text-slate-700 dark:text-slate-300">{{ selectedBrewery.city }}, {{ selectedBrewery.state }}</strong>.
              </p>
              <a
                v-if="selectedBrewery.website"
                :href="selectedBrewery.website"
                target="_blank"
                class="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-bold mt-2 hover:underline"
              >
                Visit Website <ExternalLink class="h-3 w-3" />
              </a>
            </div>

            <!-- Virtual Coordinate Plot Box -->
            <div class="w-full sm:w-48 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center font-mono">
              <span class="text-[10px] text-slate-400 uppercase font-extrabold">Geospatial Point</span>
              <span class="text-[11px] text-slate-800 dark:text-slate-300 mt-0.5 font-bold">
                {{ selectedBrewery.location.coordinates[1].toFixed(4) }}°N, {{ selectedBrewery.location.coordinates[0].toFixed(4) }}°W
              </span>
            </div>
          </div>

          <!-- Crowd-Sourced Amenities List (Runs Dynamic Aggregation) -->
          <div class="border-t border-slate-200 pt-6 dark:border-slate-800">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
              <Award class="h-4 w-4 text-emerald-500" /> Crowd-Sourced Amenities
            </h4>

            <div v-if="loadingAmenities" class="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 py-4">
              <span class="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
              Loading aggregated amenities reports...
            </div>

            <div v-else-if="detailedBrewery?.amenities && detailedBrewery.amenities.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="amenity in detailedBrewery.amenities"
                :key="amenity.slug"
                class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
              >
                <div class="space-y-0.5">
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {{ amenity.label }}
                  </p>
                  <p class="text-[10px] text-slate-400">
                    {{ amenity.slug }}
                  </p>
                </div>
                <div class="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 px-2.5 py-1 rounded-full text-xs font-bold">
                  ✓ {{ amenity.count }} reports
                </div>
              </div>
            </div>

            <div v-else class="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-800/80 text-center py-6">
              <p class="text-xs text-slate-400 dark:text-slate-500">
                No observed amenities reported for this brewery yet.
              </p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                Amenities like "dog_friendly" or "outdoor_patio" can be reported in user check-ins.
              </p>
            </div>
          </div>
        </div>

        <div v-else class="h-full flex flex-col items-center justify-center text-center py-20">
          <div class="rounded-full bg-slate-100 dark:bg-slate-900 p-4 text-slate-400 dark:text-slate-600 mb-4">
            <Compass class="h-8 w-8" />
          </div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white">Select a brewery</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
            Pick a venue from the list to inspect GPS positioning and crowd-sourced amenities.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Navigation, MapPin, ExternalLink, Award, Compass } from 'lucide-vue-next';
import api from '@/services/api';
import type { Brewery, CheckIn } from '@/types';
import InteractiveMap from './InteractiveMap.vue';

const props = defineProps<{
  breweries: Brewery[];
  checkIns: CheckIn[];
  selectedTripName?: string | null;
}>();

const selectedBrewery = ref<Brewery | null>(null);
const detailedBrewery = ref<Brewery | null>(null);
const loadingAmenities = ref(false);

watch(() => props.breweries, (newBrews) => {
  if (newBrews.length > 0 && !selectedBrewery.value) {
    selectBrewery(newBrews[0]);
  }
}, { immediate: true });

async function selectBrewery(brewery: Brewery) {
  selectedBrewery.value = brewery;
  loadingAmenities.value = true;
  detailedBrewery.value = null;

  try {
    const res = await api.get(`/breweries/${brewery.id}`);
    detailedBrewery.value = res.data;
  } catch (err) {
    console.error('Failed to load crowd-sourced amenities:', err);
  } finally {
    loadingAmenities.value = false;
  }
}
</script>
