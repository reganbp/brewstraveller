<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" @click.self="close">
      <div class="relative w-full max-w-md my-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <PlusCircle class="h-5 w-5 text-amber-500" />
            Add Planned Stop to {{ trip.name }}
          </h3>
          <button
            @click="close"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Errors -->
        <p v-if="errorMsg" class="mb-4 text-xs font-semibold text-rose-400 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30 animate-pulse">
          ⚠ {{ errorMsg }}
        </p>

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <!-- Select Brewery dropdown -->
          <div class="mb-5 space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Brewery <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="selectedBreweryId"
              required
              class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white"
            >
              <option value="" disabled>-- Select Brewery --</option>
              <option v-for="b in unselectedBreweries" :key="b.id" :value="b.id">
                {{ b.name }} ({{ b.city }}, {{ b.state }})
              </option>
            </select>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !selectedBreweryId"
            class="w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-sm font-bold text-white shadow-md disabled:opacity-50 transition-all duration-300"
          >
            <span v-if="loading" class="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Add to Itinerary
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { PlusCircle, X } from 'lucide-vue-next';
import api from '@/services/api';
import type { Brewery, Trip } from '@/types';

// Props
const props = defineProps<{
  isOpen: boolean;
  trip: Trip;
  breweries: Brewery[];
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const loading = ref(false);
const errorMsg = ref<string | null>(null);

// Input state
const selectedBreweryId = ref('');

// Filter out breweries that are already in the trip's planned_brewery_ids
const unselectedBreweries = computed(() => {
  return props.breweries.filter((b) => !props.trip.planned_brewery_ids.includes(b.id));
});

function close() {
  selectedBreweryId.value = '';
  errorMsg.value = null;
  emit('close');
}

async function handleSubmit() {
  errorMsg.value = null;

  if (!selectedBreweryId.value) {
    errorMsg.value = "Please select a brewery.";
    return;
  }

  loading.value = true;

  try {
    const updatedPlannedIds = [...props.trip.planned_brewery_ids, selectedBreweryId.value];
    
    // Save updated itinerary to database
    await api.put(`/trips/${props.trip.id}`, {
      name: props.trip.name,
      planned_brewery_ids: updatedPlannedIds
    });

    close();
    emit('success');
  } catch (err: any) {
    console.error('Failed to append itinerary stop:', err);
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to add stop to itinerary.';
  } finally {
    loading.value = false;
  }
}
</script>
