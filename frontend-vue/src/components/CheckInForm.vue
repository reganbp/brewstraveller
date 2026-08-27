<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
    <div class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 transition-all duration-300 flex flex-col gap-6">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarDays class="h-5 w-5 text-amber-500" /> Log a Brewery Visit
        </h3>
        <button
          @click="$emit('close')"
          class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Brewery Selection Mode Toggle -->
        <div class="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-fit">
          <button
            type="button"
            @click="breweryMode = 'select'"
            :class="[
              'px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex-1 sm:flex-initial text-center',
              breweryMode === 'select'
                ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            Select Existing
          </button>
          <button
            type="button"
            @click="breweryMode = 'create'"
            :class="[
              'px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex-1 sm:flex-initial text-center',
              breweryMode === 'create'
                ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            Register New (mock Google Place ID)
          </button>
        </div>

        <!-- MODE 1: Select Registered Brewery -->
        <div v-if="breweryMode === 'select'" class="space-y-2">
          <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select Brewery <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="formData.brewery_id"
            required
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:border-amber-500 focus:outline-none dark:text-white"
          >
            <option value="" disabled>-- Choose a Brewery --</option>
            <option v-for="b in breweries" :key="b.id" :value="b.id">
              {{ b.name }} ({{ b.city }}, {{ b.state }})
            </option>
          </select>
          <p v-if="breweries.length === 0" class="text-xs text-amber-600 dark:text-amber-400 italic">
            No breweries are registered yet. Choose "Register New" to add one.
          </p>
        </div>

        <!-- MODE 2: Register New Brewery Mock Form -->
        <div v-else class="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Brewery Registry Fields
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase text-slate-500">Google Place ID <span class="text-rose-500">*</span></label>
              <input
                v-model="newBrewery.google_place_id"
                required
                placeholder="e.g., ChIJiQv69m_3j4ARb7SgZ8_H1gE"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
              />
            </div>
            
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase text-slate-500">Brewery Name <span class="text-rose-500">*</span></label>
              <input
                v-model="newBrewery.name"
                required
                placeholder="e.g., Anchor Brewing"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase text-slate-500">City <span class="text-rose-500">*</span></label>
              <input
                v-model="newBrewery.city"
                required
                placeholder="e.g., San Francisco"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase text-slate-500">State (2 letters) <span class="text-rose-500">*</span></label>
              <input
                v-model="newBrewery.state"
                required
                maxlength="2"
                placeholder="e.g., CA"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 uppercase focus:outline-none dark:text-white"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase text-slate-500">Longitude <span class="text-rose-500">*</span></label>
              <input
                v-model.number="newBrewery.longitude"
                required
                type="number"
                step="any"
                placeholder="e.g., -122.401"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
              />
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase text-slate-500">Latitude <span class="text-rose-500">*</span></label>
              <input
                v-model.number="newBrewery.latitude"
                required
                type="number"
                step="any"
                placeholder="e.g., 37.762"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
              />
            </div>

            <div class="space-y-1 md:col-span-2">
              <label class="block text-[10px] font-extrabold uppercase text-slate-500">Website URL <span class="text-rose-500">*</span></label>
              <input
                v-model="newBrewery.website"
                required
                type="url"
                placeholder="e.g., https://anchorbrewing.com"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
              />
            </div>
          </div>
        </div>

        <!-- Visit Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6 dark:border-slate-900">
          <!-- Visited Date-Time -->
          <div class="space-y-1.5">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Date & Time Visited <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="formData.visited_at"
              required
              type="datetime-local"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
            />
          </div>

          <!-- Trip Name -->
          <div class="space-y-1.5">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trip / Passport Stamp Category <span class="text-slate-400">(Optional)</span>
            </label>
            <input
              v-model="formData.trip_name"
              placeholder="e.g., Sonoma Getaway"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
            />
          </div>

          <!-- Distance Traveled (miles) -->
          <div class="space-y-1.5">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Travel Distance (miles) <span class="text-rose-500">*</span>
            </label>
            <input
              v-model.number="formData.distance_miles"
              required
              type="number"
              step="any"
              min="0"
              placeholder="e.g., 24.5"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
            />
          </div>

          <!-- Transportation Mode -->
          <div class="space-y-1.5">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Transportation Mode <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="formData.transportation_mode"
              required
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
            >
              <option value="drive">Drive (Car/Motorcycle)</option>
              <option value="flight">Flight (Airplane)</option>
              <option value="walk">Walk / Cycle</option>
              <option value="transit">Public Transit (Bus/Train)</option>
            </select>
          </div>

          <!-- Rating Selector -->
          <div class="space-y-1.5">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your Rating <span class="text-rose-500">*</span>
            </label>
            <div class="flex items-center gap-2">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="formData.rating = star"
                class="text-amber-400 hover:scale-110 transition-transform"
              >
                <Star :class="['h-7 w-7', star <= formData.rating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700']" />
              </button>
              <span class="text-sm font-bold text-slate-700 dark:text-slate-300 ml-2">
                {{ formData.rating.toFixed(1) }} / 5.0
              </span>
            </div>
          </div>

          <!-- Tour Boolean Toggle -->
          <div class="space-y-1.5 flex flex-col justify-end pb-2">
            <div class="flex items-center gap-3">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="formData.took_tour" class="sr-only peer" />
                <div class="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  Took Behind-the-Scenes Tour
                </span>
                <span class="text-[10px] text-slate-400">Unlocks a dedicated tour passport stamp</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="space-y-1.5">
          <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Check-In Notes & Tasting Highlights
          </label>
          <textarea
            v-model="formData.notes"
            rows="2"
            placeholder="Describe what you tried, the taproom vibe, or souvenirs you collected..."
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
          ></textarea>
        </div>

        <!-- Amenity Tag Picker (Autocomplete, Dynamic suggested tag pills) -->
        <div class="space-y-2 border-t border-slate-100 pt-6 dark:border-slate-900">
          <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Observed Amenities Tag Picker <span class="text-slate-400">(select all that apply)</span>
          </label>

          <!-- Selected Tags Pills list -->
          <div v-if="formData.amenities_observed.length > 0" class="flex flex-wrap gap-1.5 mb-2">
            <span
              v-for="tag in formData.amenities_observed"
              :key="tag"
              class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400"
            >
              {{ formatAmenityLabel(tag) }}
              <button type="button" @click="removeAmenity(tag)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
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
                class="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:outline-none dark:text-white"
                @keydown.enter.prevent="addCustomAmenity"
              />
              <button
                type="button"
                @click="addCustomAmenity"
                class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Add custom
              </button>
            </div>

            <!-- Autocomplete suggestions overlay list -->
            <div
              v-if="showSuggestions && suggestionResults.length > 0"
              class="absolute z-50 w-full mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-lg divide-y divide-slate-100 dark:divide-slate-800"
            >
              <button
                v-for="s in suggestionResults"
                :key="s.slug"
                type="button"
                @click="selectAmenity(s.slug)"
                class="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ s.label }}</span>
                  <span class="ml-1 text-[10px] text-slate-400 font-mono">({{ s.slug }})</span>
                </div>
                <span class="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-medium">
                  {{ s.usage_count }} checkins
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Error feedback -->
        <p v-if="errorMsg" class="text-xs font-semibold text-rose-500">
          ⚠ {{ errorMsg }}
        </p>

        <!-- Form Submission Buttons -->
        <div class="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            @click="$emit('close')"
            class="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all duration-300"
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
import { CalendarDays, X, Star } from 'lucide-vue-next';
import api from '@/services/api';
import type { Brewery, AmenitySuggestion } from '@/types';

const props = defineProps<{
  breweries: Brewery[];
  initialTripName?: string | null;
  initialBreweryId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const breweryMode = ref<'select' | 'create'>('select');
const submitting = ref(false);
const errorMsg = ref<string | null>(null);

// Form inputs
const formData = reactive({
  brewery_id: '',
  visited_at: new Date().toISOString().slice(0, 16), // datetime-local format
  trip_name: '',
  distance_miles: 0,
  transportation_mode: 'drive' as 'drive' | 'flight' | 'walk' | 'transit',
  rating: 4.0,
  took_tour: false,
  notes: '',
  amenities_observed: [] as string[]
});

// Mock new brewery inputs
const newBrewery = reactive({
  google_place_id: '',
  name: '',
  city: '',
  state: '',
  longitude: -122.401,
  latitude: 37.762,
  website: ''
});

// Autocomplete tags picker state
const amenitySearch = ref('');
const showSuggestions = ref(false);
const suggestionResults = ref<AmenitySuggestion[]>([]);
let debounceTimeout: number | null = null;

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
      // Filter out already selected tags
      suggestionResults.value = res.data.filter(
        (s: AmenitySuggestion) => !formData.amenities_observed.includes(s.slug)
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

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick);
  if (props.initialTripName) {
    formData.trip_name = props.initialTripName;
  }
  if (props.initialBreweryId) {
    formData.brewery_id = props.initialBreweryId;
  }
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick);
});

function formatAmenityLabel(slug: string): string {
  return slug
    .split(/[_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function selectAmenity(slug: string) {
  if (!formData.amenities_observed.includes(slug)) {
    formData.amenities_observed.push(slug);
  }
  amenitySearch.value = '';
  showSuggestions.value = false;
}

function removeAmenity(slug: string) {
  formData.amenities_observed = formData.amenities_observed.filter((t) => t !== slug);
}

function addCustomAmenity() {
  const val = amenitySearch.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  if (val && !formData.amenities_observed.includes(val)) {
    formData.amenities_observed.push(val);
  }
  amenitySearch.value = '';
  showSuggestions.value = false;
}

async function handleSubmit() {
  errorMsg.value = null;
  submitting.value = true;

  try {
    let targetBreweryId = formData.brewery_id;

    // Register brewery first if in create mode
    if (breweryMode.value === 'create') {
      const bRes = await api.post('/breweries', {
        google_place_id: newBrewery.google_place_id,
        name: newBrewery.name,
        city: newBrewery.city,
        state: newBrewery.state,
        location: {
          type: 'Point',
          coordinates: [newBrewery.longitude, newBrewery.latitude]
        },
        website: newBrewery.website
      });
      targetBreweryId = bRes.data.id;
    }

    if (!targetBreweryId) {
      throw new Error('Brewery not selected or registered.');
    }

    // Submit check-in
    await api.post('/checkins', {
      user_id: 'default_passport_user', // Fixed user identifier for portfolio tracking
      brewery_id: targetBreweryId,
      visited_at: new Date(formData.visited_at).toISOString(),
      rating: formData.rating,
      took_tour: formData.took_tour,
      notes: formData.notes,
      distance_miles: formData.distance_miles,
      transportation_mode: formData.transportation_mode,
      trip_name: formData.trip_name || null,
      amenities_observed: formData.amenities_observed
    });

    emit('success');
  } catch (err: any) {
    console.error('Failed to log checkin:', err);
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to submit check-in.';
  } finally {
    submitting.value = false;
  }
}
</script>
