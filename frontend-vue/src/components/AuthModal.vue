<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" @click.self="close">
      <div class="relative w-full max-w-md my-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <UserIcon class="h-5 w-5 text-amber-500" />
            {{ isRegister ? 'Create Passport Profile' : 'Sign In to Passport' }}
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
          <!-- Full Name (Only for Register) -->
          <div v-if="isRegister" class="mb-4 space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Full Name <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="fullName"
              type="text"
              required
              placeholder="e.g. John Doe"
              class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
            />
          </div>

          <!-- Email Address -->
          <div class="mb-4 space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email Address <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="user@example.com"
              class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
            />
          </div>

          <!-- Password -->
          <div class="mb-4 space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
            />
          </div>

          <!-- Confirm Password (Only for Register) -->
          <div v-if="isRegister" class="mb-4 space-y-1.5">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Confirm Password <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
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
            {{ isRegister ? 'Register & Sign In' : 'Sign In' }}
          </button>
        </form>

        <!-- Toggle Links -->
        <div class="border-t border-slate-800 pt-4 mt-4 text-center text-xs text-slate-400">
          <span v-if="isRegister">Already have an account? </span>
          <span v-else>Don't have an account? </span>
          <button
            @click="toggleMode"
            class="font-bold text-amber-500 hover:text-amber-400 focus:outline-none hover:underline"
          >
            {{ isRegister ? 'Sign In' : 'Create Profile' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { User as UserIcon, X } from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';

// Props
defineProps<{
  isOpen: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

// Mode State
const isRegister = ref(false);
const loading = ref(false);
const errorMsg = ref<string | null>(null);

// Form Inputs - Discrete ref variables
const email = ref('');
const fullName = ref('');
const password = ref('');
const confirmPassword = ref('');

const { login, register } = useAuth();

// Clears all input states
function clearInputs() {
  email.value = '';
  fullName.value = '';
  password.value = '';
  confirmPassword.value = '';
  errorMsg.value = null;
}

// Mode swap handler - clears inputs on swap
function toggleMode() {
  isRegister.value = !isRegister.value;
  clearInputs();
}

// Modal close handler - clears inputs and emits close
function close() {
  clearInputs();
  emit('close');
}

async function handleSubmit() {
  errorMsg.value = null;

  // Discrete Client-side Validations
  if (!email.value.trim()) {
    errorMsg.value = "Email Address is required.";
    return;
  }
  if (!password.value) {
    errorMsg.value = "Password is required.";
    return;
  }
  if (isRegister.value && !fullName.value.trim()) {
    errorMsg.value = "Full Name is required.";
    return;
  }

  // Password confirmation check for registration
  if (isRegister.value && password.value !== confirmPassword.value) {
    errorMsg.value = "Passwords do not match.";
    return;
  }

  loading.value = true;

  try {
    if (isRegister.value) {
      await register(email.value.trim(), password.value, fullName.value.trim());
    } else {
      await login(email.value.trim(), password.value);
    }
    clearInputs();
    emit('success');
  } catch (err: any) {
    console.error('Authentication failed:', err);
    errorMsg.value = err.response?.data?.detail || err.response?.data?.message || 'Authentication failed. Please verify credentials.';
  } finally {
    loading.value = false;
  }
}
</script>
