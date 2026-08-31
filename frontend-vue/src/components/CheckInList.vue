<template>
  <div class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors duration-300">
    <div class="border-b border-slate-200 px-6 py-4 dark:border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <CalendarDays class="h-5 w-5 text-amber-500" />
        <h3 class="text-base font-bold text-slate-900 dark:text-white">Passport Feed & Timeline</h3>
      </div>
      <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
        {{ checkIns.length }} Check-ins
      </span>
    </div>

    <!-- Retroactive Check-In Grouping Action Deck (Triggers on selection) -->
    <div v-if="selectedIds.length > 0" class="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
      <div class="flex items-center justify-between text-xs">
        <span class="font-extrabold text-slate-700 dark:text-slate-300">
          🔑 {{ selectedIds.length }} stops selected for retroactive grouping
        </span>
        <button
          type="button"
          @click="selectedIds = []"
          class="text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 font-bold hover:underline"
        >
          Deselect All
        </button>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-2">
        <!-- Select Trip drop down or input -->
        <div class="flex-1 flex flex-col sm:flex-row gap-2">
          <select
            v-model="targetTripName"
            class="w-full sm:w-48 h-9 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            <option value="" disabled>-- Assign to Trip --</option>
            <option v-for="t in uniqueTripNames" :key="t" :value="t">{{ t }}</option>
            <option value="__new__">+ Create New Trip... </option>
          </select>
          
          <!-- Text Input if Create New Trip is selected -->
          <input
            v-if="targetTripName === '__new__'"
            v-model="customTripName"
            type="text"
            placeholder="Type custom trip name..."
            class="flex-1 h-9 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div class="flex gap-1.5">
          <!-- Assign Button -->
          <button
            type="button"
            @click="assignSelectedToTrip"
            :disabled="submittingBatch || (targetTripName === '__new__' && !customTripName.trim()) || !targetTripName"
            class="flex-1 sm:flex-initial h-9 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
          >
            <span v-if="submittingBatch" class="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Group
          </button>
          
          <!-- Ungroup / Detach Button -->
          <button
            type="button"
            @click="ungroupSelected"
            :disabled="submittingBatch"
            class="flex-1 sm:flex-initial h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center gap-1"
          >
            Ungroup
          </button>
        </div>
      </div>
      
      <!-- Error Feedback -->
      <p v-if="batchErrorMsg" class="text-[10px] font-semibold text-rose-500">
        ⚠ {{ batchErrorMsg }}
      </p>
    </div>

    <!-- Empty State -->
    <div v-if="checkIns.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div class="rounded-full bg-slate-100 dark:bg-slate-800/50 p-4 text-slate-400 dark:text-slate-600">
        <CalendarDays class="h-8 w-8" />
      </div>
      <h3 class="mt-4 text-sm font-semibold text-slate-900 dark:text-white">No check-ins logged yet</h3>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
        Be the first to log a visit! Click the "Log Visit" button to record a brewery visit.
      </p>
    </div>

    <!-- Feed List with selection support -->
    <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800/60">
      <li v-for="checkIn in checkIns" :key="checkIn.id" class="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
        <div class="flex items-start gap-4">
          <!-- Selection Checkbox (Touch Target compliant) -->
          <div class="pt-1.5 flex items-center h-11 w-11 justify-center flex-shrink-0">
            <input
              type="checkbox"
              :value="checkIn.id"
              v-model="selectedIds"
              class="h-5 w-5 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
          </div>

          <!-- Main Info -->
          <div class="space-y-1.5 flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h4 class="text-base font-bold text-slate-900 dark:text-white truncate">
                {{ getBreweryName(checkIn.brewery_id) }}
              </h4>
              <span class="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <MapPin class="h-3 w-3 text-slate-400" />
                {{ getBreweryLocation(checkIn.brewery_id) }}
              </span>
            </div>

            <!-- Metadata line (Date, rating, etc.) -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-550 dark:text-slate-400">
              <span class="flex items-center gap-1">
                <CalendarDays class="h-3.5 w-3.5" />
                {{ formatDate(checkIn.visited_at) }}
              </span>
              <span v-if="checkIn.trip_name" class="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                💼 {{ checkIn.trip_name }}
              </span>
              <span class="flex items-center gap-1 font-semibold text-amber-500 dark:text-amber-400">
                <Star class="h-3.5 w-3.5 fill-amber-400" />
                {{ checkIn.rating.toFixed(1) }} / 5.0
              </span>
              <span class="flex items-center gap-1">
                <component :is="getTransportIcon(checkIn.transportation_mode)" class="h-3.5 w-3.5" />
                {{ checkIn.distance_miles }} mi via {{ checkIn.transportation_mode }}
              </span>
              <span v-if="checkIn.took_tour" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
                <Award class="h-3 w-3 fill-emerald-500/20" /> Tour Medal
              </span>
            </div>

            <!-- Notes -->
            <p v-if="checkIn.notes" class="text-sm text-slate-600 dark:text-slate-300 italic pl-3 border-l-2 border-slate-200 dark:border-slate-800">
              "{{ checkIn.notes }}"
            </p>

            <!-- Amenities observed -->
            <div v-if="checkIn.amenities_observed && checkIn.amenities_observed.length > 0" class="pt-2 flex flex-wrap gap-1">
              <span
                v-for="amenity in checkIn.amenities_observed"
                :key="amenity"
                class="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
              >
                {{ formatAmenityLabel(amenity) }}
              </span>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  CalendarDays,
  Star,
  Car,
  Plane,
  Footprints,
  Bus,
  MapPin,
  Award,
  X
} from '@lucide/vue';
import api from '@/services/api';
import type { CheckIn, Brewery } from '@/types';

const props = defineProps<{
  checkIns: CheckIn[];
  breweries: Brewery[];
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// Batch selection states
const selectedIds = ref<string[]>([]);
const targetTripName = ref('');
const customTripName = ref('');
const submittingBatch = ref(false);
const batchErrorMsg = ref<string | null>(null);

// Extract list of all distinct trip names dynamically
const uniqueTripNames = computed(() => {
  const names = props.checkIns
    .map((c) => c.trip_name)
    .filter((name): name is string => typeof name === 'string' && !!name.trim());
  return Array.from(new Set(names)).sort();
});

function getBreweryName(id: string): string {
  const b = props.breweries.find((brew) => brew.id === id);
  return b ? b.name : 'Unknown Brewery';
}

function getBreweryLocation(id: string): string {
  const b = props.breweries.find((brew) => brew.id === id);
  return b ? `${b.city}, ${b.state}` : '';
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return isoString;
  }
}

function getTransportIcon(mode: string) {
  switch (mode) {
    case 'drive':
      return Car;
    case 'flight':
      return Plane;
    case 'walk':
      return Footprints;
    case 'transit':
      return Bus;
    default:
      return Car;
  }
}

function formatAmenityLabel(slug: string): string {
  return slug
    .split(/[_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Retroactive check-in grouping (assign batch)
async function assignSelectedToTrip() {
  batchErrorMsg.value = null;

  let nameToAssign = targetTripName.value;
  if (nameToAssign === '__new__') {
    nameToAssign = customTripName.value.trim();
  }

  if (!nameToAssign) {
    batchErrorMsg.value = 'Please choose a target trip name.';
    return;
  }

  submittingBatch.value = true;

  try {
    await api.patch('/checkins/assign-trip', {
      checkin_ids: selectedIds.value,
      trip_name: nameToAssign
    });

    selectedIds.value = [];
    targetTripName.value = '';
    customTripName.value = '';
    emit('success');
  } catch (err: any) {
    console.error('Failed to group checkins:', err);
    batchErrorMsg.value = err.response?.data?.message || err.message || 'Failed to group check-ins.';
  } finally {
    submittingBatch.value = false;
  }
}

// Retroactive ungroup (batch set trip_name = null)
async function ungroupSelected() {
  batchErrorMsg.value = null;
  submittingBatch.value = true;

  try {
    await api.patch('/checkins/assign-trip', {
      checkin_ids: selectedIds.value,
      trip_name: null
    });

    selectedIds.value = [];
    targetTripName.value = '';
    customTripName.value = '';
    emit('success');
  } catch (err: any) {
    console.error('Failed to ungroup checkins:', err);
    batchErrorMsg.value = err.response?.data?.message || err.message || 'Failed to ungroup check-ins.';
  } finally {
    submittingBatch.value = false;
  }
}
</script>
