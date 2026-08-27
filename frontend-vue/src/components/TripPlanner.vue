<template>
  <!-- Main Card Container -->
  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-200">
    <!-- Clickable Header Container -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 cursor-pointer select-none" @click="isCollapsed = !isCollapsed">
      <!-- Left side: Icon, title, and active trip count badge -->
      <div class="flex items-center gap-3">
        <Map class="h-5 w-5 text-amber-500" />
        <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Trip Planner & Journey Log</h3>
        
        <!-- Active Summary Badge -->
        <span
          v-if="summarizedTrips.length > 0"
          class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white dark:bg-amber-600 shadow-sm"
        >
          {{ summarizedTrips.length }} Logged {{ summarizedTrips.length === 1 ? 'Journey' : 'Journeys' }}
        </span>
      </div>

      <!-- Right side actions: Includes both + New Trip and collapse button -->
      <div class="flex items-center gap-3" @click.stop>
        <!-- "+ New Trip" button -->
        <button
          type="button"
          @click="showCreateTripModal = true"
          class="inline-flex items-center justify-center gap-1.5 px-4 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-xs font-bold text-white shadow-md active:scale-95 transition-all duration-200"
        >
          <Plus class="h-4 w-4" /> New Trip
        </button>

        <!-- Standardised Collapse Chevron button -->
        <button
          type="button"
          @click.stop="isCollapsed = !isCollapsed"
          class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
          title="Toggle collapsible panel"
        >
          <ChevronDown
            :class="['h-5 w-5 transition-transform duration-200', { 'rotate-180': !isCollapsed }]"
          />
        </button>
      </div>
    </div>

    <!-- Collapsible Plain Body Container -->
    <div v-show="!isCollapsed" class="mt-4">
      <div class="pt-2">
        <!-- Empty State -->
        <div v-if="summarizedTrips.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div class="rounded-full bg-slate-100 dark:bg-slate-800/50 p-4 text-slate-400 dark:text-slate-600 mb-2">
            <Compass class="h-8 w-8" />
          </div>
          <h3 class="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No active trips planned</h3>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4">
            Plan a weekend getaway or beer tour by creating a decoupled itinerary card.
          </p>
          <button
            type="button"
            @click="showCreateTripModal = true"
            class="inline-flex items-center justify-center gap-1.5 px-5 h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow transition-all duration-300"
          >
            <Plus class="h-4 w-4" /> Plan First Journey
          </button>
        </div>

        <!-- Trip Cards Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="trip in summarizedTrips"
            :key="trip.id"
            @click="toggleTrip(trip.name)"
            :class="[
              'relative rounded-xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:scale-[1.01] min-h-[160px]',
              selectedTripName?.toLowerCase() === trip.name.toLowerCase()
                ? 'bg-amber-500/5 border-amber-500 dark:bg-amber-500/10 shadow-md ring-1 ring-amber-500/20'
                : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-900/40'
            ]"
          >
            <!-- Highlight/Select indicator -->
            <span
              v-if="selectedTripName?.toLowerCase() === trip.name.toLowerCase()"
              class="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full"
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
                  <p class="text-[9px] uppercase font-bold text-slate-400">Planned Stops</p>
                  <p class="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {{ trip.venueCount }}
                  </p>
                </div>
                <div>
                  <p class="text-[9px] uppercase font-bold text-slate-400">Visited Miles</p>
                  <p class="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {{ trip.totalDistance.toFixed(1) }} mi
                  </p>
                </div>
                <div>
                  <p class="text-[9px] uppercase font-bold text-slate-400">Avg Rating</p>
                  <p class="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    ★ {{ trip.avgRating > 0 ? trip.avgRating.toFixed(1) : '—' }}
                  </p>
                </div>
              </div>

              <!-- Action button dock -->
              <div class="flex items-center gap-2 pt-1" @click.stop>
                <!-- Add Stop button -->
                <button
                  type="button"
                  @click="openAddStop(trip.rawTrip)"
                  class="flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold transition-all shadow-sm"
                >
                  <Plus class="h-3.5 w-3.5" /> Add Stop
                </button>
                
                <!-- Manage Trip button -->
                <button
                  type="button"
                  @click="openManageModal(trip.rawTrip)"
                  class="p-2 h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors"
                  title="Manage Trip Stops"
                >
                  <Settings class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Trip Shell Modal overlay -->
    <CreateTripModal
      :is-open="showCreateTripModal"
      @close="showCreateTripModal = false"
      @success="handleTripShellCreateSuccess"
    />

    <!-- Add Itinerary Stop Modal overlay -->
    <AddItineraryStopModal
      v-if="showAddStopModal && activeStopTrip"
      :is-open="showAddStopModal"
      :trip="activeStopTrip"
      :breweries="breweries"
      @close="closeAddStop"
      @success="handleTripUpdateSuccess"
    />

    <!-- Edit/Manage Trip Stops Modal overlay -->
    <EditTripModal
      v-if="showEditTripModal && activeEditTrip"
      :is-open="showEditTripModal"
      :trip="activeEditTrip"
      :check-ins="checkIns"
      :breweries="breweries"
      @close="closeManageModal"
      @success="handleTripUpdateSuccess"
      @stamp-stop="forwardStampPassport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Map, Compass, Navigation, Calendar, ChevronDown, Plus, Settings } from 'lucide-vue-next';
import type { CheckIn, Brewery, Trip } from '@/types';
import CreateTripModal from './CreateTripModal.vue';
import AddItineraryStopModal from './AddItineraryStopModal.vue';
import EditTripModal from './EditTripModal.vue';

// Props
const props = defineProps<{
  checkIns: CheckIn[];
  breweries: Brewery[];
  trips: Trip[];
  selectedTripName: string | null;
}>();

// Emits
const emit = defineEmits<{
  (e: 'select-trip', tripName: string | null): void;
  (e: 'trip-created'): void;
  (e: 'add-stop', breweryId: string, tripName: string): void;
}>();

// Collapsible State
const isCollapsed = ref(false);
const showCreateTripModal = ref(false);

const showAddStopModal = ref(false);
const activeStopTrip = ref<Trip | null>(null);

const showEditTripModal = ref(false);
const activeEditTrip = ref<Trip | null>(null);

// Structure representing aggregated trip details for UI cards
interface TripSummary {
  id: string;
  name: string;
  totalDistance: number;
  venueCount: number;
  avgRating: number;
  dateRange: string;
  rawTrip: Trip;
}

// Compute structured trip cards from decoupled trips array and check-ins
const summarizedTrips = computed<TripSummary[]>(() => {
  return props.trips.map((trip) => {
    // Filter check-ins belonging to this trip
    const tripCheckins = props.checkIns
      .filter((c) => c.trip_name?.toLowerCase() === trip.name.toLowerCase())
      .sort((a, b) => new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime());

    const totalDistance = tripCheckins.reduce((sum, c) => sum + c.distance_miles, 0);
    const avgRating = tripCheckins.length > 0
      ? tripCheckins.reduce((sum, c) => sum + c.rating, 0) / tripCheckins.length
      : 0.0;

    // Date range formatting
    let dateRange = 'Planned itinerary';
    if (tripCheckins.length > 0) {
      const first = new Date(tripCheckins[0].visited_at);
      const last = new Date(tripCheckins[tripCheckins.length - 1].visited_at);
      
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const fStr = first.toLocaleDateString(undefined, options);
      const lStr = last.toLocaleDateString(undefined, options);

      dateRange = fStr === lStr ? fStr : `${fStr} – ${lStr}`;
    } else if (trip.planned_brewery_ids.length > 0) {
      dateRange = `${trip.planned_brewery_ids.length} stops planned`;
    }

    return {
      id: trip.id,
      name: trip.name,
      totalDistance,
      venueCount: trip.planned_brewery_ids.length,
      avgRating,
      dateRange,
      rawTrip: trip
    };
  }).sort((a, b) => b.name.localeCompare(a.name));
});

function handleTripShellCreateSuccess(createdTripName: string) {
  showCreateTripModal.value = false;
  emit('select-trip', createdTripName);
  emit('trip-created'); // refreshes trips from DB
}

function handleTripUpdateSuccess() {
  emit('trip-created'); // refreshes lists
}

function openAddStop(trip: Trip) {
  activeStopTrip.value = trip;
  showAddStopModal.value = true;
}

function closeAddStop() {
  activeStopTrip.value = null;
  showAddStopModal.value = false;
}

function openManageModal(trip: Trip) {
  activeEditTrip.value = trip;
  showEditTripModal.value = true;
}

function closeManageModal() {
  activeEditTrip.value = null;
  showEditTripModal.value = false;
}

// Forward the stamp passport trigger to App.vue (opens CheckInForm)
function forwardStampPassport(breweryId: string, tripName: string) {
  showEditTripModal.value = false;
  emit('add-stop', breweryId, tripName);
}

function toggleTrip(tripName: string) {
  if (props.selectedTripName?.toLowerCase() === tripName.toLowerCase()) {
    emit('select-trip', null);
  } else {
    emit('select-trip', tripName);
  }
}
</script>
