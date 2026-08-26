<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
    <div class="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 transition-all duration-300 flex flex-col gap-5">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
        <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <UserIcon class="h-5 w-5 text-amber-500" />
          {{ isRegister ? 'Create Passport Profile' : 'Sign In to Passport' }}
        </h3>
        <button
          @click="$emit('close')"
          class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Errors -->
      <p v-if="errorMsg" class="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-200/50 dark:border-rose-900/30 animate-pulse">
        ⚠ {{ errorMsg }}
      </p>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Full Name (Only for Register) -->
        <div v-if="isRegister" class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Full Name <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="formData.full_name"
            required
            placeholder="e.g. Brenda Regan"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:border-amber-500 focus:outline-none dark:text-white"
          />
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Email Address <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="formData.email"
            type="email"
            required
            placeholder="user@example.com"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:border-amber-500 focus:outline-none dark:text-white"
          />
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Password <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="formData.password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:border-amber-500 focus:outline-none dark:text-white"
          />
        </div>

        <!-- Confirm Password (Only for Register) -->
        <div v-if="isRegister" class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Confirm Password <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="formData.confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 focus:border-amber-500 focus:outline-none dark:text-white"
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-5 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 transition-all duration-300"
        >
          <span v-if="loading" class="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ isRegister ? 'Register & Sign In' : 'Sign In' }}
        </button>
      </form>

      <!-- Toggle Links -->
      <div class="border-t border-slate-200 pt-3 text-center text-xs text-slate-500 dark:border-slate-800">
        <span v-if="isRegister">Already have an account? </span>
        <span v-else>Don't have an account? </span>
        <button
          @click="isRegister = !isRegister; errorMsg = null;"
          class="font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 focus:outline-none hover:underline"
        >
          {{ isRegister ? 'Sign In' : 'Create Profile' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { User as UserIcon, X } from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const isRegister = ref(false);
const loading = ref(false);
const errorMsg = ref<string | null>(null);

const { login, register } = useAuth();

const formData = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  full_name: ''
});

async function handleSubmit() {
  errorMsg.value = null;

  // Basic client-side validation
  if (!formData.email.trim()) {
    errorMsg.value = "Email Address is required.";
    return;
  }
  if (!formData.password.trim()) {
    errorMsg.value = "Password is required.";
    return;
  }
  if (isRegister.value && !formData.full_name.trim()) {
    errorMsg.value = "Full Name is required.";
    return;
  }

  // Confirm passwords match during registration
  if (isRegister.value && formData.password !== formData.confirmPassword) {
    errorMsg.value = "Passwords do not match.";
    return;
  }

  loading.value = true;

  try {
    if (isRegister.value) {
      await register(formData.email.trim(), formData.password, formData.full_name.trim());
    } else {
      await login(formData.email.trim(), formData.password);
    }
    emit('success');
  } catch (err: any) {
    console.error('Authentication failed:', err);
    errorMsg.value = err.response?.data?.detail || err.response?.data?.message || 'Authentication failed. Please verify credentials.';
  } finally {
    loading.value = false;
  }
}
</script>
