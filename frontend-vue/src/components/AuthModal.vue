<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" @click.self="close">
      <div class="relative w-full max-w-md my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserIcon class="h-5 w-5 text-amber-500" />
            <span v-if="mode === 'register'">Create Passport Profile</span>
            <span v-else-if="mode === 'login'">Sign In to Passport</span>
            <span v-else>Reset Account Password</span>
          </h3>
          <button
            @click="close"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Errors / Success Banner Feedbacks -->
        <p v-if="errorMsg" class="mb-4 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/30 animate-pulse">
          ⚠ {{ errorMsg }}
        </p>
        <p v-if="successMsg" class="mb-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/30 animate-pulse">
          ✓ {{ successMsg }}
        </p>

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <!-- Full Name (Only for Register) -->
          <div v-if="mode === 'register'" class="mb-4 space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Full Name <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="fullName"
              type="text"
              required
              placeholder="e.g. John Doe"
              class="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <!-- Email / Username Address -->
          <div class="mb-4 space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <span v-if="mode === 'reset'">Username or Email</span>
              <span v-else>Email Address</span>
              <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="email"
              type="text"
              required
              placeholder="user@example.com"
              class="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <!-- Password field -->
          <div class="mb-4 space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <span v-if="mode === 'reset'">New Password</span>
                <span v-else>Password</span>
                <span class="text-rose-500">*</span>
              </label>

              <!-- Forgot password trigger button -->
              <button
                v-if="mode === 'login'"
                type="button"
                @click="switchToReset"
                class="text-[11px] font-bold text-amber-500 hover:text-amber-400 focus:outline-none hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <!-- Confirm Password (Only for Register) -->
          <div v-if="mode === 'register'" class="mb-4 space-y-1.5">
            <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Confirm Password <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              class="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-5 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 transition-all duration-300 mt-2"
          >
            <span v-if="loading" class="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-if="mode === 'register'">Register & Sign In</span>
            <span v-else-if="mode === 'login'">Sign In</span>
            <span v-else>Update Password</span>
          </button>
        </form>

        <!-- Toggle Links -->
        <div class="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-2">
          <!-- Switch triggers -->
          <div v-if="mode === 'reset'">
            <button
              @click="mode = 'login'; clearInputs();"
              class="font-bold text-amber-500 hover:text-amber-400 focus:outline-none hover:underline"
            >
              &larr; Back to Login
            </button>
          </div>
          <div v-else>
            <span v-if="mode === 'register'">Already have an account? </span>
            <span v-else>Don't have an account? </span>
            <button
              @click="toggleMode"
              class="font-bold text-amber-500 hover:text-amber-400 focus:outline-none hover:underline"
            >
              {{ mode === 'register' ? 'Sign In' : 'Create Profile' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { User as UserIcon, X } from '@lucide/vue';
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

// Mode State: login, register, reset
const mode = ref<'login' | 'register' | 'reset'>('login');
const loading = ref(false);
const registerIsAdmin = ref(false);
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

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
  registerIsAdmin.value = false;
  errorMsg.value = null;
  successMsg.value = null;
}

// Mode swap handler - clears inputs on swap
function toggleMode() {
  mode.value = mode.value === 'register' ? 'login' : 'register';
  clearInputs();
}

function switchToReset() {
  mode.value = 'reset';
  clearInputs();
}

// Modal close handler - clears inputs and emits close
function close() {
  clearInputs();
  mode.value = 'login';
  emit('close');
}

async function handleSubmit() {
  errorMsg.value = null;
  successMsg.value = null;

  // Discrete Client-side Validations
  if (!email.value.trim()) {
    errorMsg.value = mode.value === 'reset' ? "Username or Email is required." : "Email Address is required.";
    return;
  }
  if (!password.value) {
    errorMsg.value = mode.value === 'reset' ? "New Password is required." : "Password is required.";
    return;
  }
  if (mode.value === 'register' && !fullName.value.trim()) {
    errorMsg.value = "Full Name is required.";
    return;
  }

  // Password confirmation check for registration
  if (mode.value === 'register' && password.value !== confirmPassword.value) {
    errorMsg.value = "Passwords do not match.";
    return;
  }

  loading.value = true;

  try {
    if (mode.value === 'register') {
      await register(email.value.trim(), password.value, fullName.value.trim(), registerIsAdmin.value);
      clearInputs();
      emit('success');
    } else if (mode.value === 'login') {
      await login(email.value.trim(), password.value);
      clearInputs();
      emit('success');
    } else {
      // Password reset mode
      await api.post('/auth/reset-password', {
        username: email.value.trim(),
        new_password: password.value
      });
      
      successMsg.value = "Password updated! Redirecting to login...";
      
      setTimeout(() => {
        clearInputs();
        mode.value = 'login';
      }, 1500);
    }
  } catch (err: any) {
    console.error('Authentication action failed:', err);
    errorMsg.value = err.response?.data?.detail || err.response?.data?.message || 'Action failed. Please verify submitted credentials.';
  } finally {
    loading.value = false;
  }
}
</script>
