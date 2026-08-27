<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" @click.self="close">
      <div class="relative w-full max-w-md my-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <Compass class="h-5 w-5 text-amber-500 animate-spin-slow" />
            Plan a New Itinerary
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

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-5 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 transition-all duration-300 mt-2"
          >
            <span v-if="loading" class="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Create Itinerary Plan
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

// Props
defineProps<{
  isOpen: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', createdTripName: string): void;
}>();

const loading = ref(false);
const errorMsg = ref<string | null>(null);

// Inputs
const tripName = ref('');

function close() {
  tripName.value = '';
  errorMsg.value = null;
  emit('close');
}

async function handleSubmit() {
  errorMsg.value = null;

  if (!tripName.value.trim()) {
    errorMsg.value = "Trip Name is required.";
    return;
  }

  loading.value = true;

  try {
    const completedName = tripName.value.trim();
    
    // Create new Trip record in DB collection
    await api.post('/trips', {
      name: completedName,
      planned_brewery_ids: []
    });

    tripName.value = '';
    emit('success', completedName);
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
