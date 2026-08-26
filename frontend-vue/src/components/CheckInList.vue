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

    <!-- Feed List -->
    <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800/60">
      <li v-for="checkIn in checkIns" :key="checkIn.id" class="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <!-- Main Info -->
          <div class="space-y-1.5 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h4 class="text-base font-bold text-slate-900 dark:text-white">
                {{ getBreweryName(checkIn.brewery_id) }}
              </h4>
              <span class="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <MapPin class="h-3 w-3 text-slate-400" />
                {{ getBreweryLocation(checkIn.brewery_id) }}
              </span>
            </div>

            <!-- Metadata line (Date, rating, etc.) -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span class="flex items-center gap-1">
                <CalendarDays class="h-3.5 w-3.5" />
                {{ formatDate(checkIn.visited_at) }}
              </span>
              <span v-if="checkIn.trip_name" class="font-medium text-indigo-600 dark:text-indigo-400">
                ✈️ {{ checkIn.trip_name }}
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
import {
  CalendarDays,
  Star,
  Car,
  Plane,
  Footprints,
  Bus,
  MapPin,
  Award
} from 'lucide-vue-next';
import type { CheckIn, Brewery } from '@/types';

const props = defineProps<{
  checkIns: CheckIn[];
  breweries: Brewery[];
}>();

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
</script>
