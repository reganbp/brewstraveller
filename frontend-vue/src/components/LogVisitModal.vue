<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" @click.self="close">
    <div class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl flex flex-col gap-5 mt-4 mb-4">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
          <CalendarDays class="h-5 w-5 text-amber-500 animate-pulse" /> Log a Brewery Visit
        </h3>
        <button
          @click="close"
          class="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Errors -->
      <p v-if="errorMsg" class="text-xs font-semibold text-rose-400 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30 animate-pulse">
        ⚠ {{ errorMsg }}
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Brewery Selection Mode Toggle -->
        <div class="flex items-center gap-4 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-fit">
          <button
            type="button"
            @click="breweryMode = 'select'"
            :class="[
              'px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex-1 sm:flex-initial text-center h-8',
              breweryMode === 'select'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            Select Existing
          </button>
          <button
            type="button"
            @click="breweryMode = 'create'"
            :class="[
              'px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex-1 sm:flex-initial text-center h-8',
              breweryMode === 'create'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            Register New Brewery
          </button>
        </div>

        <!-- MODE 1: Select Registered Brewery -->
        <div v-if="breweryMode === 'select'" class="space-y-2">
          <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Select Brewery <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="selectedBreweryId"
            required
            class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white"
          >
            <option value="" disabled>-- Choose a Brewery --</option>
            <option v-for="b in breweries" :key="b.id" :value="b.id">
              {{ b.name }} ({{ b.city }}, {{ b.state }})
            </option>
          </select>
          <p v-if="breweries.length === 0" class="text-xs text-amber-500 italic">
            No breweries are registered yet. Choose "Register New" to add one.
          </p>
        </div>

        <!-- MODE 2: Register New Brewery Tab with Map Pinning and Auto-Geocoding -->
        <div v-else class="space-y-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-amber-500">
            Brewery Registry Fields
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase text-slate-400">Brewery Name <span class="text-rose-500">*</span></label>
              <input
                v-model="newBrewery.name"
                required
                placeholder="e.g. Anchor Brewing"
                class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase text-slate-400">Street Address <span class="text-slate-500">(Optional)</span></label>
              <input
                v-model="newBrewery.street"
                placeholder="e.g. 1705 Mariposa St"
                class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase text-slate-400">City <span class="text-rose-500">*</span></label>
              <input
                v-model="newBrewery.city"
                required
                placeholder="e.g. San Francisco"
                class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase text-slate-400">State (2 letters) <span class="text-rose-500">*</span></label>
              <input
                v-model="newBrewery.state"
                required
                maxlength="2"
                placeholder="e.g. CA"
                class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500 uppercase"
              />
            </div>

            <!-- Optional Website URL -->
            <div class="space-y-1 md:col-span-2">
              <label class="block text-[10px] font-extrabold uppercase text-slate-400">Website URL <span class="text-slate-500">(Optional)</span></label>
              <input
                v-model="newBrewery.website"
                type="url"
                placeholder="e.g. https://anchorbrewing.com"
                class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
              />
            </div>
          </div>

          <!-- Mini-map Picker container (for exact coordinates drop) -->
          <div class="space-y-1.5 mt-2">
            <span class="block text-[10px] font-extrabold uppercase text-slate-400 flex items-center justify-between">
              <span>Geospatial Pin <span class="text-rose-500">*</span></span>
              
              <div class="flex items-center gap-2">
                <!-- Use Current Location GPS trigger -->
                <button
                  type="button"
                  @click="useCurrentLocation"
                  class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-extrabold flex items-center gap-1 shadow-sm cursor-pointer transition-colors h-7"
                >
                  📍 Use Current Location
                </button>
                <span class="text-amber-500 font-mono text-[9px] uppercase hidden sm:inline">Tap map or drag pin</span>
              </div>
            </span>
            <div ref="miniMapContainer" class="h-44 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 z-10 relative"></div>
            <div class="text-[10px] font-mono text-slate-500 flex items-center gap-2 mt-1 justify-end">
              <span>Coordinates: [{{ newBreweryCoords[0].toFixed(5) }}°W, {{ newBreweryCoords[1].toFixed(5) }}°N]</span>
              <span v-if="geocoding" class="text-amber-400 animate-pulse">Auto-geocoding...</span>
            </div>
          </div>
        </div>

        <!-- Visit Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-850 pt-6">
          <!-- Visited Date-Time -->
          <div class="space-y-1.5">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Date & Time Visited <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="visitedAt"
              required
              type="datetime-local"
              class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:outline-none text-white focus:border-amber-500"
            />
          </div>

          <!-- Trip / Category Selector Dropdown -->
          <div class="space-y-1.5">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Assign to Journey / Trip <span class="text-slate-500">(Optional)</span>
            </label>
            <select
              v-model="selectedTripName"
              class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:outline-none text-white focus:border-amber-500"
            >
              <option value="">No Trip Assignment (Single Stop)</option>
              <option v-for="t in trips" :key="t.id" :value="t.name">
                💼 {{ t.name }}
              </option>
            </select>
          </div>

          <!-- Auto-Calculated Distance Info Badge (No manual miles input) -->
          <div class="space-y-1.5 md:col-span-2">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Travel Distance Tracking
            </label>
            <div class="flex items-center gap-2.5 px-4 h-11 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-500 font-bold">
              <Compass class="h-4 w-4 animate-spin-slow" />
              <span>Distance: Auto-calculated via Home Location &rarr; Venue GPS</span>
            </div>
          </div>

          <!-- Rating Selector -->
          <div class="space-y-1.5">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Your Rating <span class="text-rose-500">*</span>
            </label>
            <div class="flex items-center gap-2 h-11">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="rating = star"
                class="text-amber-450 hover:scale-110 transition-transform"
              >
                <Star :class="['h-7 w-7', star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700']" />
              </button>
              <span class="text-sm font-bold text-slate-300 ml-2">
                {{ rating.toFixed(1) }} / 5.0
              </span>
            </div>
          </div>

          <!-- Tour Boolean Toggle -->
          <div class="space-y-1.5 flex flex-col justify-end pb-2">
            <div class="flex items-center gap-3 h-11">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="tookTour" class="sr-only peer" />
                <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-slate-200 flex items-center gap-1">
                  Took Behind-the-Scenes Tour
                </span>
                <span class="text-[10px] text-slate-500">Unlocks a dedicated tour passport stamp</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="space-y-1.5">
          <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Check-In Notes & Tasting Highlights
          </label>
          <textarea
            v-model="notes"
            rows="2"
            placeholder="Describe what you tried, the taproom vibe, or souvenirs you collected..."
            class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:outline-none text-white focus:border-amber-500 placeholder-slate-500"
          ></textarea>
        </div>

        <!-- Amenity Tag Picker -->
        <div class="space-y-2 border-t border-slate-850 pt-6">
          <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Observed Amenities Tag Picker <span class="text-slate-500">(select all that apply)</span>
          </label>

          <!-- Selected Tags Pills list -->
          <div v-if="amenitiesObserved.length > 0" class="flex flex-wrap gap-1.5 mb-2">
            <span
              v-for="tag in amenitiesObserved"
              :key="tag"
              class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400"
            >
              {{ formatAmenityLabel(tag) }}
              <button type="button" @click="removeAmenity(tag)" class="text-slate-500 hover:text-slate-200">
                <X class="h-3 w-3" />
              </button>
            </span>
          </div>

          <!-- Autocomplete search bar -->
          <div class="relative">
            <div class="flex gap-2">
              <input
                v-model="amenitySearch"
                @focus="showSuggestions = true"
                placeholder="Search amenities (e.g., dog_friendly, trivia, serves_food...)"
                class="flex-1 h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:outline-none text-white focus:border-amber-500 placeholder-slate-500"
                @keydown.enter.prevent="addCustomAmenity"
              />
              <button
                type="button"
                @click="addCustomAmenity"
                class="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 rounded-xl text-xs font-bold text-slate-300 h-11"
              >
                Add custom
              </button>
            </div>

            <!-- Autocomplete suggestions overlay list -->
            <div
              v-if="showSuggestions && suggestionResults.length > 0"
              class="absolute z-50 w-full mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-lg divide-y divide-slate-800"
            >
              <button
                v-for="s in suggestionResults"
                :key="s.slug"
                type="button"
                @click="selectAmenity(s.slug)"
                class="w-full text-left px-4 py-2.5 hover:bg-slate-800/60 transition-colors flex items-center justify-between text-xs text-slate-200"
              >
                <div>
                  <span class="font-bold text-slate-200">{{ s.label }}</span>
                  <span class="ml-1 text-[10px] text-slate-500 font-mono">({{ s.slug }})</span>
                </div>
                <span class="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full text-slate-400 font-medium">
                  {{ s.usage_count }} checkins
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Submit Buttons -->
        <div class="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            @click="close"
            class="rounded-xl border border-slate-700 px-5 py-2.5 h-11 text-xs font-bold hover:bg-slate-800 text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-5 py-2.5 h-11 text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all duration-300"
          >
            <span v-if="submitting" class="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Stamp Passport
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { CalendarDays, X, Star, Compass } from 'lucide-vue-next';
import L from 'leaflet';
import api from '@/services/api';
import type { Brewery, AmenitySuggestion, Trip } from '@/types';

// Props
const props = withDefaults(
  defineProps<{
    breweries?: Brewery[];
    trips?: Trip[];
    initialTripName?: string | null;
    initialBreweryId?: string | null;
  }>(),
  {
    breweries: () => [],
    trips: () => [],
    initialTripName: null,
    initialBreweryId: null
  }
);

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const breweryMode = ref<'select' | 'create'>('select');
const submitting = ref(false);
const errorMsg = ref<string | null>(null);

// Form Fields
const selectedBreweryId = ref(props.initialBreweryId || '');
const visitedAt = ref(new Date().toISOString().slice(0, 16)); // local time string
const selectedTripName = ref(props.initialTripName || '');
const rating = ref(4.0);
const tookTour = ref(false);
const notes = ref('');
const amenitiesObserved = ref<string[]>([]);

// Register New Brewery Inputs
const newBrewery = reactive({
  name: '',
  street: '',
  city: '',
  state: '',
  website: ''
});

// Mini Map state
const miniMapContainer = ref<HTMLDivElement | null>(null);
const newBreweryCoords = ref<[number, number]>([-122.401, 37.762]); // [longitude, latitude]
let miniMap: L.Map | null = null;
let miniMarker: L.Marker | null = null;
const geocoding = ref(false);

// Autocomplete tag picker state
const amenitySearch = ref('');
const showSuggestions = ref(false);
const suggestionResults = ref<AmenitySuggestion[]>([]);
let debounceTimeout: number | null = null;
let geocodeTimeout: number | null = null;

// Initialize mini map picker lazily when entering create mode
function initMiniMap() {
  if (!miniMapContainer.value || miniMap) return;

  const defaultLat = newBreweryCoords.value[1];
  const defaultLng = newBreweryCoords.value[0];

  miniMap = L.map(miniMapContainer.value, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([defaultLat, defaultLng], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(miniMap);

  // Custom static pin overrides to bypass Vite image bundling bugs
  const customIcon = L.icon({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  miniMarker = L.marker([defaultLat, defaultLng], {
    draggable: true,
    icon: customIcon
  }).addTo(miniMap);

  // Sync coords on drag
  miniMarker.on('dragend', () => {
    if (miniMarker) {
      const pos = miniMarker.getLatLng();
      newBreweryCoords.value = [pos.lng, pos.lat];
    }
  });

  // Sync coords on map click
  miniMap.on('click', (e: L.LeafletMouseEvent) => {
    const pos = e.latlng;
    newBreweryCoords.value = [pos.lng, pos.lat];
    if (miniMarker) {
      miniMarker.setLatLng(pos);
    }
  });
}

// Watch breweryMode to initialize mini map picker lazily
watch(breweryMode, (newVal) => {
  if (newVal === 'create') {
    setTimeout(() => {
      initMiniMap();
      if (miniMap) {
        miniMap.invalidateSize();
      }
    }, 50);
  }
});

// Watch City + State to trigger auto-geocoding Nominatim query
watch([() => newBrewery.city, () => newBrewery.state], () => {
  if (geocodeTimeout) clearTimeout(geocodeTimeout);

  const city = newBrewery.city.trim();
  const state = newBrewery.state.trim();

  if (!city || state.length < 2) return;

  geocoding.value = true;
  geocodeTimeout = window.setTimeout(async () => {
    try {
      const queryStr = `${city}, ${state}, USA`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        newBreweryCoords.value = [lon, lat];

        // Update map positioning and pin
        if (miniMap && miniMarker) {
          miniMarker.setLatLng([lat, lon]);
          miniMap.setView([lat, lon], 12);
        }
      }
    } catch (err) {
      console.warn('Auto-geocoding Nominatim lookup failed:', err);
    } finally {
      geocoding.value = false;
    }
  }, 800); // 800ms debounce
});

// Watch search query and call autocomplete debounced
watch(amenitySearch, (newVal) => {
  if (debounceTimeout) clearTimeout(debounceTimeout);

  if (!newVal.trim()) {
    suggestionResults.value = [];
    return;
  }

  debounceTimeout = window.setTimeout(async () => {
    try {
      const res = await api.get('/amenities/suggest', {
        params: { q: newVal.trim() }
      });
      suggestionResults.value = res.data.filter(
        (s: AmenitySuggestion) => !amenitiesObserved.value.includes(s.slug)
      );
    } catch (err) {
      console.error('Failed to autocomplete suggestions:', err);
    }
  }, 300);
});

// Close suggestions on outside click
function handleOutsideClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.relative')) {
    showSuggestions.value = false;
  }
}

// Call Geolocation on Tap '📍 Use Current Location'
function useCurrentLocation() {
  if (!navigator.geolocation) {
    console.warn('Geolocation is not supported by your browser.');
    errorMsg.value = "Geolocation is not supported by this browser.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      newBreweryCoords.value = [lon, lat];

      // Update Map centering and Pin location
      if (miniMap && miniMarker) {
        miniMarker.setLatLng([lat, lon]);
        miniMap.setView([lat, lon], 13);
      }

      // Reverse geocode via Nominatim reverse lookup
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        if (data && data.address) {
          const city = data.address.city || data.address.town || data.address.village || data.address.hamlet || '';
          const state = data.address.state ? data.address.state : '';
          
          if (city) newBrewery.city = city;
          if (state) {
            newBrewery.state = state.length === 2 ? state : state.substring(0, 2).toUpperCase();
          }
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err);
      }
    },
    (error) => {
      console.warn('Geolocation failed:', error);
      errorMsg.value = "Could not access device location. Please check your location permissions.";
      setTimeout(() => {
        if (errorMsg.value && errorMsg.value.includes('location')) {
          errorMsg.value = null;
        }
      }, 5000);
    }
  );
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick);
  if (miniMap) {
    miniMap.remove();
    miniMap = null;
  }
});

function formatAmenityLabel(slug: string): string {
  return slug
    .split(/[_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function selectAmenity(slug: string) {
  if (!amenitiesObserved.value.includes(slug)) {
    amenitiesObserved.value.push(slug);
  }
  amenitySearch.value = '';
  showSuggestions.value = false;
}

function removeAmenity(slug: string) {
  amenitiesObserved.value = amenitiesObserved.value.filter((t) => t !== slug);
}

function addCustomAmenity() {
  const val = amenitySearch.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  if (val && !amenitiesObserved.value.includes(val)) {
    amenitiesObserved.value.push(val);
  }
  amenitySearch.value = '';
  showSuggestions.value = false;
}

function close() {
  selectedBreweryId.value = '';
  visitedAt.value = new Date().toISOString().slice(0, 16);
  selectedTripName.value = '';
  rating.value = 4.0;
  tookTour.value = false;
  notes.value = '';
  amenitiesObserved.value = [];
  
  newBrewery.name = '';
  newBrewery.street = '';
  newBrewery.city = '';
  newBrewery.state = '';
  newBrewery.website = '';

  errorMsg.value = null;
  emit('close');
}

async function handleSubmit() {
  errorMsg.value = null;
  submitting.value = true;

  try {
    let targetBreweryId = selectedBreweryId.value;

    // Register brewery first if in create mode
    if (breweryMode.value === 'create') {
      const bRes = await api.post('/breweries', {
        google_place_id: 'custom_' + Date.now(), // Auto-generate place ID under-the-hood
        name: newBrewery.name.trim(),
        city: newBrewery.city.trim(),
        state: newBrewery.state.trim().toUpperCase(),
        location: {
          type: 'Point',
          coordinates: newBreweryCoords.value // coordinates: [lng, lat]
        },
        website: newBrewery.website.trim() || '' // website is completely optional now!
      });
      targetBreweryId = bRes.data.id;
    }

    if (!targetBreweryId) {
      throw new Error('Brewery not selected or registered.');
    }

    // Submit check-in (distance is computed dynamically on backend Haversine engine!)
    await api.post('/checkins', {
      user_id: 'default_passport_user', // Enforced securely by server
      brewery_id: targetBreweryId,
      visited_at: new Date(visitedAt.value).toISOString(),
      rating: rating.value,
      took_tour: tookTour.value,
      notes: notes.value.trim(),
      distance_miles: 0, // Mock zero, auto-recalculated sequentially by server!
      transportation_mode: 'drive',
      trip_name: selectedTripName.value || null,
      amenities_observed: amenitiesObserved.value
    });

    close();
    emit('success');
  } catch (err: any) {
    console.error('Failed to log checkin:', err);
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to submit check-in.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
