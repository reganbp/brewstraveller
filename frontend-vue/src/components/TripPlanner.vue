<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors duration-300 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
      <div class="flex items-center gap-2">
        <Map class="h-5 w-5 text-amber-500" />
        <h3 class="text-base font-bold text-slate-900 dark:text-white">Trip Planner & Journey Log</h3>
      </div>
      <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
        {{ trips.length }} Active Journeys
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="trips.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div class="rounded-full bg-slate-100 dark:bg-slate-800/50 p-4 text-slate-400 dark:text-slate-600">
        <Compass class="h-8 w-8" />
      </div>
      <h3 class="mt-4 text-sm font-semibold text-slate-900 dark:text-white">No active trips planned</h3>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
        To form a trip, type in a "Trip Name" when logging your next check-in. This will group visits chronologically.
      </p>
    </div>

    <!-- Trip Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="trip in trips"
        :key="trip.name"
        @click="toggleTrip(trip.name)"
        :class="[
          'relative rounded-xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:scale-[1.01]',
          selectedTripName === trip.name
            ? 'bg-amber-500/5 border-amber-500 dark:bg-amber-500/10 shadow-md ring-1 ring-amber-500/20'
            : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-900/40'
        ]"
      >
        <!-- Highlight indicator -->
        <span
          v-if="selectedTripName === trip.name"
          class="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full"
        >
          <Navigation class="h-3 w-3 fill-amber-500/20" /> Mapping Route
        </span>

        <div class="space-y-3">
          <!-- Trip Title -->
          <div>
            <h4 class="text-base font-extrabold text-slate-900 dark:text-white">
              {{ trip.name }}
            </h4>
            <span class="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <Calendar class="h-3.5 w-3.5" />
              {{ trip.dateRange }}
            </span>
          </div>

          <!-- Trip Stats -->
          <div class="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-200/60 dark:border-slate-800/80 text-center">
            <div>
              <p class="text-[10px] uppercase font-bold text-slate-400">Venues</p>
              <p class="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {{ trip.venueCount }}
              </p>
            </div>
            <div>
              <p class="text-[10px] uppercase font-bold text-slate-400">Distance</p>
              <p class="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {{ trip.totalDistance.toFixed(1) }} mi
              </p>
            </div>
            <div>
              <p class="text-[10px] uppercase font-bold text-slate-400">Avg Rating</p>
              <p class="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                ★ {{ trip.avgRating.toFixed(1) }}
              </p>
            </div>
          </div>

          <!-- Unique Amenities Encountered -->
          <div v-if="trip.uniqueAmenities.length > 0">
            <p class="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Unique Experiences Map</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="amenity in trip.uniqueAmenities.slice(0, 4)"
                :key="amenity"
                class="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
              >
                {{ formatAmenityLabel(amenity) }}
              </span>
              <span v-if="trip.uniqueAmenities.length > 4" class="text-[10px] font-bold text-slate-400 p-0.5">
                +{{ trip.uniqueAmenities.length - 4 }} more
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Map, Compass, Navigation, Calendar } from 'lucide-vue-next';
import type { CheckIn, Brewery } from '@/types';

// Props
const props = defineProps<{
  checkIns: CheckIn[];
  breweries: Brewery[];
  selectedTripName: string | null;
}>();

// Emits
const emit = defineEmits<{
  (e: 'select-trip', tripName: string | null): void;
}>();

// Structure representing aggregated trip details
interface TripSummary {
  name: string;
  checkins: CheckIn[];
  totalDistance: number;
  venueCount: number;
  avgRating: number;
  dateRange: string;
  uniqueAmenities: string[];
}

// Compute aggregated list of trips based on check-ins
const trips = computed<TripSummary[]>(() => {
  const groups: Record<string, CheckIn[]> = {};

  // Group check-ins which have a trip_name
  props.checkIns.forEach((checkIn) => {
    if (checkIn.trip_name && checkIn.trip_name.trim()) {
      const name = checkIn.trip_name.trim();
      if (!groups[name]) groups[name] = [];
      groups[name].push(checkIn);
    }
  });

  return Object.keys(groups).map((name) => {
    const checkins = groups[name].sort(
      (a, b) => new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime()
    );

    // Sum details
    const totalDistance = checkins.reduce((sum, c) => sum + c.distance_miles, 0);
    const uniqueBreweries = [...new Set(checkins.map((c) => c.brewery_id))];
    const avgRating = checkins.reduce((sum, c) => sum + c.rating, 0) / checkins.length;

    // Dates formatter
    let dateRange = '';
    if (checkins.length > 0) {
      const first = new Date(checkins[0].visited_at);
      const last = new Date(checkins[checkins.length - 1].visited_at);
      
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const fStr = first.toLocaleDateString(undefined, options);
      const lStr = last.toLocaleDateString(undefined, options);

      dateRange = fStr === lStr ? fStr : `${fStr} – ${lStr}`;
    }

    // Unique amenities
    const amenitySet = new Set<string>();
    checkins.forEach((c) => {
      if (c.amenities_observed) {
        c.amenities_observed.forEach((a) => amenitySet.add(a));
      }
    });

    return {
      name,
      checkins,
      totalDistance,
      venueCount: uniqueBreweries.length,
      avgRating,
      dateRange,
      uniqueAmenities: [...amenitySet]
    };
  }).sort((a, b) => b.name.localeCompare(a.name)); // Alphabetical sorting
});

function toggleTrip(tripName: string) {
  if (props.selectedTripName === tripName) {
    // Clear selection
    emit('select-trip', null);
  } else {
    emit('select-trip', tripName);
  }
}

function formatAmenityLabel(slug: string): string {
  return slug
    .split(/[_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
</script>
