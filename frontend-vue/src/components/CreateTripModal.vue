<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" @click.self="close">
      <div class="relative w-full max-w-md my-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <Compass class="h-5 w-5 text-amber-500 animate-spin-slow" />
            Plan a New Journey Itinerary
          </h3>
          <button
            @click="close"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Errors / Success Feedbacks -->
        <p v-if="errorMsg" class="mb-4 text-xs font-semibold text-rose-400 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30 animate-pulse">
          ⚠ {{ errorMsg }}
        </p>
        <p v-if="successMsg" class="mb-4 text-xs font-semibold text-emerald-400 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/30 animate-pulse">
          ✓ {{ successMsg }}
        </p>

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <!-- Trip Name -->
          <div class="mb-4 space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Trip Name <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="tripName"
              type="text"
              required
              placeholder="e.g. Vermont Craft Tour 2026"
              class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
            />
          </div>

          <!-- Start Brewery Selection -->
          <div class="mb-4 space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Starting Venue / Brewery <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="startBreweryId"
              required
              class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white"
            >
              <option value="" disabled>-- Select Start Venue --</option>
              <option v-for="b in breweries" :key="b?.id" :value="b?.id">
                {{ b?.name }} ({{ b?.city }}, {{ b?.state }})
              </option>
            </select>
            <p v-if="!breweries || !breweries.length" class="text-xs text-amber-500 italic mt-1">
              No breweries registered yet. Please add a brewery first.
            </p>
          </div>

          <!-- Description / Notes -->
          <div class="mb-4 space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Trip Notes / Description <span class="text-slate-500">(Optional)</span>
            </label>
            <textarea
              v-model="tripNotes"
              rows="3"
              placeholder="e.g. Exploring the best New England IPAs over a long weekend..."
              class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !breweries || !breweries.length"
            class="w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-5 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 transition-all duration-300 mt-2"
          >
            <span v-if="loading" class="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Initialize Journey Itinerary
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Compass, X } from 'lucide-vue-next';
import api from '@/services/api';
import type { Brewery } from '@/types';

// Props withDefaults configuration per defensive requirements
const props = withDefaults(
  defineProps<{
    breweries?: Brewery[];
    isOpen?: boolean;
  }>(),
  {
    breweries: () => [],
    isOpen: false
  }
);

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', createdTripName: string): void;
}>();

const loading = ref(false);
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

// Inputs
const tripName = ref('');
const startBreweryId = ref('');
const tripNotes = ref('');

function close() {
  tripName.value = '';
  startBreweryId.value = '';
  tripNotes.value = '';
  errorMsg.value = null;
  successMsg.value = null;
  emit('close');
}

async function handleSubmit() {
  errorMsg.value = null;
  successMsg.value = null;

  if (!tripName.value.trim()) {
    errorMsg.value = "Trip Name is required.";
    return;
  }
  if (!startBreweryId.value) {
    errorMsg.value = "Starting Venue is required.";
    return;
  }

  loading.value = true;

  try {
    const completedName = tripName.value.trim();
    const completedDescription = tripNotes.value.trim() || null;
    
    // 1. Create new Trip record in DB collection with description and starting planned_brewery_ids
    await api.post('/trips', {
      name: completedName,
      description: completedDescription,
      planned_brewery_ids: [startBreweryId.value]
    });

    // 2. Log initial check-in stop matching starting brewery under this trip
    await api.post('/checkins', {
      user_id: 'default_passport_user', // Enforced by backend securely
      brewery_id: startBreweryId.value,
      visited_at: new Date().toISOString(),
      rating: 5.0, // Start with top rating
      took_tour: false,
      notes: completedDescription || `Journey started at the first venue!`,
      distance_miles: 0,
      transportation_mode: 'drive',
      trip_name: completedName,
      amenities_observed: []
    });

    successMsg.value = `Trip "${completedName}" successfully created with its start brewery!`;
    
    setTimeout(() => {
      tripName.value = '';
      startBreweryId.value = '';
      tripNotes.value = '';
      emit('success', completedName);
    }, 1000);

  } catch (err: any) {
    console.error('Failed to create trip record:', err);
    errorMsg.value = err.response?.data?.message || err.response?.data?.detail || 'Failed to initialize trip itinerary plan.';
  } finally {
    loading.value = false;
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
