<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" @click.self="close">
      <div class="relative w-full max-w-md my-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <UserIcon class="h-5 w-5 text-amber-500" />
            My Passport Profile
          </h3>
          <button
            @click="close"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Feedback Messages -->
        <p v-if="errorMsg" class="text-xs font-semibold text-rose-400 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30 animate-pulse">
          ⚠ {{ errorMsg }}
        </p>
        <p v-if="successMsg" class="text-xs font-semibold text-emerald-400 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/30 animate-pulse">
          ✓ {{ successMsg }}
        </p>

        <!-- Profile Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Email Address (Disabled/Read-only) -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Email Address <span class="text-[10px] text-slate-550 lowercase">(read-only)</span>
            </label>
            <input
              :value="user?.email"
              type="email"
              disabled
              class="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-500 focus:outline-none cursor-not-allowed"
            />
          </div>

          <!-- Username / Display Name -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Username / Display Name <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="username"
              type="text"
              required
              placeholder="e.g. John Doe"
              class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
            />
          </div>

          <!-- Home Location with "Detect Location" and GPS status badge -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Home Location
              </label>
              
              <!-- Detect current city GPS trigger -->
              <button
                type="button"
                @click="detectHomeLocation"
                :disabled="detecting"
                class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded text-[9px] font-extrabold flex items-center gap-1 shadow-sm cursor-pointer transition-colors"
              >
                <span v-if="detecting" class="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span v-else>📍 Detect City</span>
              </button>
            </div>
            
            <input
              v-model="homeCity"
              @input="detectedCoords = null"
              type="text"
              placeholder="e.g. Charlton, MA or Portland, ME"
              class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
            />

            <!-- GPS Pin status badge -->
            <div
              v-if="user?.home_coordinates && user.home_coordinates.length === 2"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-[10px] font-mono text-amber-500 font-bold"
            >
              🎯 GPS Pin: [{{ user.home_coordinates[0].toFixed(3) }}°W, {{ user.home_coordinates[1].toFixed(3) }}°N]
            </div>
            <div
              v-else-if="homeCity.trim() && (!user?.home_coordinates)"
              class="text-[10px] text-amber-500 italic"
            >
              ⚡ GPS coordinates will be auto-calculated on Save
            </div>
            <div v-else class="text-[10px] text-slate-500 italic">
              No home coordinates pinned yet.
            </div>
          </div>

          <!-- Save Button -->
          <button
            type="submit"
            :disabled="loading || !username.trim()"
            class="w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-5 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 transition-all duration-300 mt-4"
          >
            <span v-if="loading" class="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Save Profile Changes
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { User as UserIcon, X } from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';
import api from '@/services/api';

// Props
defineProps<{
  isOpen: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const loading = ref(false);
const detecting = ref(false);
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

const { user } = useAuth();

// Form inputs
const username = ref('');
const homeCity = ref('');
const detectedCoords = ref<[number, number] | null>(null);

watch(user, (newVal) => {
  if (newVal) {
    username.value = newVal.full_name || '';
    homeCity.value = newVal.home_city || '';
  }
}, { immediate: true });

function close() {
  errorMsg.value = null;
  successMsg.value = null;
  emit('close');
}

// Geolocation GPS lookup + reverse geocoding via Nominatim
function detectHomeLocation() {
  if (!navigator.geolocation) {
    errorMsg.value = "Geolocation is not supported by this browser.";
    return;
  }

  detecting.value = true;
  errorMsg.value = null;
  successMsg.value = null;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      detectedCoords.value = [lon, lat];

      try {
        // Reverse geocode via Nominatim reverse lookup
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        
        if (data && data.address) {
          const city = data.address.city || data.address.town || data.address.village || data.address.hamlet || '';
          const state = data.address.state ? data.address.state : '';
          
          if (city && state) {
            const formattedState = state.length === 2 ? state.toUpperCase() : state;
            homeCity.value = `${city}, ${formattedState}`;
            successMsg.value = `Successfully detected home location!`;
          } else if (city) {
            homeCity.value = city;
            successMsg.value = `Successfully detected city!`;
          } else {
            errorMsg.value = "Could not resolve a specific city address. Please type it manually.";
          }
        } else {
          errorMsg.value = "Could not resolve GPS address.";
        }
      } catch (err) {
        console.warn('Nominatim reverse lookup failed:', err);
        errorMsg.value = "Failed to reverse geocode GPS location.";
      } finally {
        detecting.value = false;
      }
    },
    (error) => {
      console.warn('Geolocation access failed:', error);
      errorMsg.value = "Could not access GPS location. Please check your browser permissions.";
      detecting.value = false;
    }
  );
}

async function handleSubmit() {
  errorMsg.value = null;
  successMsg.value = null;

  if (!username.value.trim()) {
    errorMsg.value = "Username / Display Name is required.";
    return;
  }

  loading.value = true;

  try {
    const usernameContent = username.value.trim();
    const homeCityContent = homeCity.value.trim();

    // Call profile update router
    const res = await api.put('/auth/profile', {
      username: usernameContent,
      home_city: homeCityContent || '', // clear if empty
      home_coordinates: detectedCoords.value
    });

    // Update shared auth reactive ref + local storage session securely
    if (user.value) {
      user.value.full_name = res.data.full_name;
      user.value.home_city = res.data.home_city;
      user.value.home_coordinates = res.data.home_coordinates;
      localStorage.setItem('bt_user', JSON.stringify(user.value));
    }

    successMsg.value = "Profile saved successfully!";
    
    setTimeout(() => {
      close();
      emit('success'); // Triggers stats and distance recalculations refresh in App.vue
    }, 1000);

  } catch (err: any) {
    console.error('Failed to update profile:', err);
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to update profile.';
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
