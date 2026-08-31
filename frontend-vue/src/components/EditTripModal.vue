<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" @click.self="close">
      <div class="relative w-full max-w-lg my-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <Edit2 class="h-5 w-5 text-amber-500" />
            Manage Trip: {{ trip.name }}
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

        <!-- Section 1: Rename Trip -->
        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
            Rename Trip
          </label>
          <div class="flex gap-2">
            <input
              v-model="newTripName"
              type="text"
              placeholder="e.g. Vermont Tour 2.0"
              class="flex-1 h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
            />
            <button
              type="button"
              @click="handleRename"
              :disabled="savingRename || !newTripName.trim() || newTripName.trim() === trip.name"
              class="px-4 py-2 h-11 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all duration-200"
            >
              <span v-if="savingRename" class="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 inline-block"></span>
              Save
            </button>
          </div>
        </div>

        <!-- Section 2: Current Itinerary Stops (Planned & Visited) -->
        <div class="space-y-3 border-t border-slate-800 pt-4">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Itinerary Stops ({{ tripStops.length }})</span>
            <span class="text-[10px] text-slate-500 lowercase">planned & visited logs</span>
          </h4>

          <div v-if="tripStops.length === 0" class="text-xs text-slate-500 italic py-2">
            No stops in this trip. Add some planned stops or select unassigned visits below!
          </div>

          <ul v-else class="divide-y divide-slate-800/50 max-h-56 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/50 p-2 space-y-2">
            <li v-for="stop in tripStops" :key="stop.id" class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate-900/40 rounded-lg text-xs gap-3">
              <div class="truncate pr-2 space-y-1">
                <div class="flex items-center gap-2">
                  <p class="font-extrabold text-slate-200 truncate text-sm">
                    {{ getBreweryName(stop.breweryId) }}
                  </p>
                  <!-- Badge state -->
                  <span v-if="stop.type === 'visited'" class="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                    Visited
                  </span>
                  <span v-else class="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/10 border border-amber-500/25 text-amber-400">
                    Planned
                  </span>
                </div>
                <!-- visited description -->
                <p v-if="stop.type === 'visited' && stop.checkin" class="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>📅 {{ formatDate(stop.checkin.visited_at) }}</span>
                  <span class="text-amber-500">★ {{ stop.checkin.rating.toFixed(1) }}</span>
                </p>
                <p v-else class="text-[10px] text-slate-500 italic">
                  Not visited yet. Ready to stamp passport!
                </p>
              </div>

              <!-- Stop Actions -->
              <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                <!-- Stamp Passport button (if planned) -->
                <button
                  v-if="stop.type === 'planned'"
                  type="button"
                  @click="stampPassport(stop.breweryId)"
                  class="px-2.5 py-1.5 h-8 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded transition-colors"
                >
                  Stamp Passport
                </button>
                <button
                  type="button"
                  @click="removeStop(stop)"
                  class="px-2.5 py-1.5 h-8 text-[10px] font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 rounded border border-rose-900/40 transition-colors"
                >
                  Remove
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- Section 3: Retroactive Grouping of past visits -->
        <div class="space-y-3 border-t border-slate-800 pt-4">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Link Past Unassigned Visits ({{ unassignedCheckins.length }})
          </h4>

          <div v-if="unassignedCheckins.length === 0" class="text-xs text-slate-500 italic py-2">
            All check-ins are already linked to trips.
          </div>

          <ul v-else class="divide-y divide-slate-800/50 max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/50 p-2 space-y-1">
            <li v-for="c in unassignedCheckins" :key="c.id" class="flex items-center justify-between p-2 hover:bg-slate-900/50 rounded-lg text-xs">
              <div class="truncate pr-4 space-y-0.5">
                <p class="font-bold text-slate-200 truncate">
                  {{ getBreweryName(c.brewery_id) }}
                </p>
                <p class="text-[10px] text-slate-400">
                  {{ formatDate(c.visited_at) }}
                </p>
              </div>
              <button
                type="button"
                @click="addStopFromPast(c.id, c.brewery_id)"
                class="px-2.5 py-1 text-[10px] font-bold text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 rounded border border-amber-900/40 transition-colors flex-shrink-0"
              >
                + Add Stop
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Edit2, X } from '@lucide/vue';
import api from '@/services/api';
import type { CheckIn, Brewery, Trip } from '@/types';

const props = defineProps<{
  isOpen: boolean;
  trip: Trip;
  checkIns: CheckIn[];
  breweries: Brewery[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
  (e: 'stamp-stop', breweryId: string, tripName: string): void;
}>();

const newTripName = ref(props.trip.name);
const savingRename = ref(false);
const errorMsg = ref<string | null>(null);

// Structure representing combined list of planned & visited stops
interface StopSummary {
  id: string; // matches checkin ID or brewery ID
  breweryId: string;
  type: 'planned' | 'visited';
  checkin?: CheckIn;
}

// Compute dynamic chronological stops by merging planned IDs and Visited logs
const tripStops = computed<StopSummary[]>(() => {
  const list: StopSummary[] = [];
  
  // 1. Add all planned stops
  props.trip.planned_brewery_ids.forEach((breweryId) => {
    const checkin = props.checkIns.find(
      (c) => c.trip_name?.toLowerCase() === props.trip.name.toLowerCase() && c.brewery_id === breweryId
    );
    if (checkin) {
      list.push({ id: checkin.id, breweryId, type: 'visited', checkin });
    } else {
      list.push({ id: breweryId, breweryId, type: 'planned' });
    }
  });

  // 2. Add retroactive check-ins assigned to tripName but NOT in planned list
  const otherCheckins = props.checkIns.filter(
    (c) =>
      c.trip_name?.toLowerCase() === props.trip.name.toLowerCase() &&
      !props.trip.planned_brewery_ids.includes(c.brewery_id)
  );

  otherCheckins.forEach((c) => {
    list.push({ id: c.id, breweryId: c.brewery_id, type: 'visited', checkin: c });
  });

  return list;
});

// Check-ins that don't belong to any trip
const unassignedCheckins = computed(() => {
  return props.checkIns.filter((c) => !c.trip_name);
});

function getBreweryName(id: string): string {
  const b = props.breweries.find((brew) => brew.id === id);
  return b ? b.name : 'Unknown Brewery';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function close() {
  newTripName.value = props.trip.name;
  errorMsg.value = null;
  emit('close');
}

// Rename Trip
async function handleRename() {
  if (!newTripName.value.trim() || newTripName.value.trim() === props.trip.name) return;
  
  savingRename.value = true;
  errorMsg.value = null;

  try {
    // 1. Rename trip record
    await api.put(`/trips/${props.trip.id}`, {
      name: newTripName.value.trim(),
      planned_brewery_ids: props.trip.planned_brewery_ids
    });

    emit('success');
  } catch (err: any) {
    console.error('Failed to rename trip:', err);
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to rename trip.';
  } finally {
    savingRename.value = false;
  }
}

// Detach/Remove stop from trip
async function removeStop(stop: StopSummary) {
  try {
    // 1. If visited check-in exists, clear its trip_name
    if (stop.type === 'visited' && stop.checkin) {
      await api.put(`/checkins/${stop.id}`, {
        trip_name: null
      });
    }

    // 2. Remove brewery ID from planned_brewery_ids
    const updatedPlannedIds = props.trip.planned_brewery_ids.filter((id) => id !== stop.breweryId);
    await api.put(`/trips/${props.trip.id}`, {
      name: props.trip.name,
      planned_brewery_ids: updatedPlannedIds
    });

    emit('success');
  } catch (err: any) {
    console.error('Failed to remove itinerary stop:', err);
    errorMsg.value = 'Failed to remove itinerary stop.';
  }
}

// Stamp passport / Check In for planned stop
function stampPassport(breweryId: string) {
  emit('stamp-stop', breweryId, props.trip.name);
}

// Link a past unassigned visit to this trip (Sets trip_name = trip.name & appends planned id)
async function addStopFromPast(checkinId: string, breweryId: string) {
  try {
    // 1. Set check-in's trip_name
    await api.put(`/checkins/${checkinId}`, {
      trip_name: props.trip.name
    });

    // 2. Append brewery ID to planned_brewery_ids list
    const updatedPlannedIds = [...props.trip.planned_brewery_ids, breweryId];
    await api.put(`/trips/${props.trip.id}`, {
      name: props.trip.name,
      planned_brewery_ids: updatedPlannedIds
    });

    emit('success');
  } catch (err: any) {
    console.error('Failed to append past check-in stop:', err);
    errorMsg.value = 'Failed to link past unassigned visit.';
  }
}
</script>
