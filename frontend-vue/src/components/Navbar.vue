<template>
  <header class="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 transition-colors duration-300">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Logo / Brand -->
      <div class="flex items-center gap-2">
        <Beer class="h-7 w-7 text-amber-500 fill-amber-500 animate-pulse" />
        <span class="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
          BrewsTraveller
        </span>
        <span class="hidden lg:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          Portfolio Passport
        </span>
      </div>

      <!-- Desktop Navigation Controls (md and above) -->
      <div class="hidden md:flex items-center gap-4">
        <!-- Latency Monitor -->
        <div class="flex items-center gap-2 px-3 py-1.5 h-11 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Zap :class="['h-3.5 w-3.5', latencyColor]" />
          <span class="text-slate-500 dark:text-slate-400 capitalize hidden lg:inline">
            {{ activeBackend === 'node' ? 'Node.js' : 'FastAPI' }}:
          </span>
          <span v-if="latency !== null" :class="latencyTextColor">
            {{ latency }}ms
          </span>
          <span v-else class="text-slate-400 dark:text-slate-500 animate-pulse">
            offline
          </span>
        </div>

        <!-- Backend Toggle Switch -->
        <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 h-11 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            @click="setBackend('node')"
            :class="[
              'px-3 py-1.5 h-9 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[36px]',
              activeBackend === 'node'
                ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            Node
          </button>
          <button
            @click="setBackend('python')"
            :class="[
              'px-3 py-1.5 h-9 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[36px]',
              activeBackend === 'python'
                ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            ]"
          >
            Python
          </button>
        </div>

        <!-- User Authentication & Role-Based Controls -->
        <div class="flex items-center gap-2">
          <!-- Desktop Admin Dropdown Selector (shows if user is registered admin) -->
          <select
            v-if="isLoggedIn && (user?.is_admin || user?.role === 'admin')"
            @change="handleAdminSelect"
            class="bg-slate-100 dark:bg-slate-900 text-amber-500 border border-slate-200 dark:border-slate-800 rounded-xl text-xs h-11 px-3 py-1 font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-all focus:outline-none"
          >
            <option value="">⚙️ Admin Data...</option>
            <option value="users">Users</option>
            <option value="breweries">Breweries</option>
            <option value="checkins">Check-ins</option>
            <option value="trips">Trips</option>
          </select>

          <!-- Logged In chip with UserProfileModal trigger -->
          <div v-if="isLoggedIn && user" class="flex items-center gap-2 h-11">
            <button
              @click="showProfileModal = true"
              class="hidden md:inline-flex flex-col items-start px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-left hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors cursor-pointer h-11 justify-center min-w-[120px]"
            >
              <span class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <UserIcon class="h-3.5 w-3.5 text-amber-500" />
                {{ user.full_name }}
              </span>
              <span v-if="user.home_city" class="text-[9px] text-slate-500 dark:text-slate-400 pl-5 font-bold truncate max-w-[110px]">
                📍 {{ user.home_city }}
              </span>
            </button>
            <button
              @click="logout"
              title="Sign Out"
              class="p-2.5 h-11 w-11 flex items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40 transition-colors"
            >
              <LogOut class="h-5 w-5" />
            </button>
          </div>

          <!-- Logged out button -->
          <button
            v-else
            @click="showAuthModal = true"
            class="inline-flex items-center gap-1.5 px-4 h-11 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-extrabold rounded-xl shadow transition-all"
          >
            <LogIn class="h-4 w-4" /> Sign In
          </button>
        </div>

        <!-- Dark/Light Toggle -->
        <button
          @click="toggleTheme"
          class="p-2.5 h-11 w-11 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
          title="Toggle color theme"
        >
          <Sun v-if="isDark" class="h-5 w-5" />
          <Moon v-else class="h-5 w-5" />
        </button>
      </div>

      <!-- Hamburger Button (Mobile - md:hidden) -->
      <div class="flex items-center md:hidden gap-3">
        <!-- Latency Monitor -->
        <div class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Zap :class="['h-3 w-3', latencyColor]" />
          <span v-if="latency !== null" :class="latencyTextColor" class="text-[10px]">
            {{ latency }}ms
          </span>
          <span v-else class="text-[10px] text-slate-400 dark:text-slate-500 animate-pulse">
            off
          </span>
        </div>

        <button
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="p-2.5 h-11 w-11 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <X v-if="isMobileMenuOpen" class="h-6 w-6" />
          <Menu v-else class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Collapsible Mobile Menu Drawer (md:hidden) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform -translate-y-3 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-3 opacity-0"
    >
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden border-b border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950 space-y-6 transition-colors duration-300"
      >
        <!-- Mobile Backend Toggle Switch -->
        <div class="space-y-1.5">
          <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Select Active Backend
          </span>
          <div class="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-850 h-11 items-center">
            <button
              @click="setBackend('node')"
              :class="[
                'h-8 rounded-lg text-xs font-bold transition-all duration-200',
                activeBackend === 'node'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              ]"
            >
              Node.js API
            </button>
            <button
              @click="setBackend('python')"
              :class="[
                'h-8 rounded-lg text-xs font-bold transition-all duration-200',
                activeBackend === 'python'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              ]"
            >
              Python API
            </button>
          </div>
        </div>

        <!-- Mobile Theme Toggle -->
        <div class="space-y-1.5">
          <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Appearance Theme
          </span>
          <button
            @click="toggleTheme"
            class="flex items-center justify-between w-full h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <span class="flex items-center gap-2">
              <Sun v-if="isDark" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
              Toggle theme
            </span>
            <span class="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {{ isDark ? 'Dark Mode' : 'Light Mode' }}
            </span>
          </button>
        </div>

        <!-- Mobile Admin Controls -->
        <div v-if="isLoggedIn && (user?.is_admin || user?.role === 'admin')" class="space-y-1.5 border-t border-slate-100 dark:border-slate-900 pt-5">
          <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            System Administration
          </span>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="col in ['users', 'breweries', 'checkins', 'trips']"
              :key="col"
              @click="openAdminFromMobile(col)"
              class="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 capitalize text-center cursor-pointer"
            >
              {{ col }}
            </button>
          </div>
        </div>

        <!-- Mobile User Auth Control -->
        <div class="space-y-1.5 border-t border-slate-100 dark:border-slate-900 pt-5">
          <span class="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Passport Profile
          </span>
          
          <!-- Logged In Chip with UserProfileModal trigger -->
          <div v-if="isLoggedIn && user" class="space-y-3">
            <button
              @click="handleMobileProfile"
              class="flex flex-col items-start px-4 py-2 w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-left hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <span class="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <UserIcon class="h-4.5 w-4.5 text-amber-500" />
                {{ user.full_name }}
              </span>
              <span v-if="user.home_city" class="text-[9px] text-slate-500 dark:text-slate-400 pl-7 font-bold">
                📍 {{ user.home_city }} (Tap to Edit)
              </span>
            </button>
            <button
              @click="handleMobileLogout"
              class="flex items-center justify-center gap-1.5 w-full h-11 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-extrabold border border-rose-150 dark:border-rose-900/40 transition-colors"
            >
              <LogOut class="h-4 w-4" /> Sign Out
            </button>
          </div>

          <!-- Logged out button -->
          <button
            v-else
            @click="handleMobileLogin"
            class="flex items-center justify-center gap-1.5 w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-extrabold rounded-xl shadow transition-all"
          >
            <LogIn class="h-4 w-4" /> Sign In / Register
          </button>
        </div>
      </div>
    </transition>

    <!-- Toggleable Authentication modal overlay -->
    <AuthModal
      :is-open="showAuthModal"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />

    <!-- Toggleable User Profile modal overlay -->
    <UserProfileModal
      :is-open="showProfileModal"
      @close="showProfileModal = false"
      @success="handleProfileSuccess"
    />

    <!-- Toggleable Admin Data Management Modal overlay -->
    <AdminManagementModal
      v-if="showAdminModal && selectedCollection"
      :is-open="showAdminModal"
      :collection="selectedCollection"
      @close="closeAdminModal"
      @success="handleAdminSuccess"
    />
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Beer, Zap, Sun, Moon, LogIn, LogOut, User as UserIcon, Menu, X } from '@lucide/vue';
import api, { activeBackend, latency, setBackend } from '@/services/api';
import { useAuth } from '@/composables/useAuth';
import { useTheme } from '@/composables/useTheme';
import AuthModal from './AuthModal.vue';
import UserProfileModal from './UserProfileModal.vue';
import AdminManagementModal from './AdminManagementModal.vue';

// Emits
const emit = defineEmits<{
  (e: 'auth-success'): void;
}>();

const showAuthModal = ref(false);
const showProfileModal = ref(false);
const showAdminModal = ref(false);
const selectedCollection = ref('');
const isMobileMenuOpen = ref(false);

const { isLoggedIn, user, logout } = useAuth();
const { isDark, toggleTheme } = useTheme();

function handleMobileProfile() {
  isMobileMenuOpen.value = false;
  showProfileModal.value = true;
}

function handleProfileSuccess() {
  emit('auth-success');
}

function handleAdminSelect(event: Event) {
  const target = event.target as HTMLSelectElement;
  if (target.value) {
    selectedCollection.value = target.value;
    showAdminModal.value = true;
    target.value = ''; // Reset select tag
  }
}

function openAdminFromMobile(col: string) {
  selectedCollection.value = col;
  showAdminModal.value = true;
  isMobileMenuOpen.value = false;
}

function closeAdminModal() {
  showAdminModal.value = false;
  selectedCollection.value = '';
}

function handleAdminSuccess() {
  emit('auth-success'); // Re-loads statistical panels
}

// Compute colors based on response latency
const latencyColor = computed(() => {
  if (latency.value === null) return 'text-slate-400 dark:text-slate-600';
  if (latency.value < 50) return 'text-emerald-500 fill-emerald-500/20';
  if (latency.value < 150) return 'text-amber-500 fill-amber-500/20';
  return 'text-rose-500 fill-rose-500/20';
});

const latencyTextColor = computed(() => {
  if (latency.value === null) return 'text-slate-400';
  if (latency.value < 50) return 'text-emerald-600 dark:text-emerald-400 font-bold';
  if (latency.value < 150) return 'text-amber-600 dark:text-amber-400 font-semibold';
  return 'text-rose-600 dark:text-rose-400 font-bold animate-pulse';
});

// Periodic ping loop to keep latency monitor updated
let pingInterval: number | null = null;

async function pingBackend() {
  try {
    await api.get('/health');
  } catch (err) {
    console.warn('Backend is currently offline or unreachable.');
    latency.value = null;
  }
}

function handleAuthSuccess() {
  showAuthModal.value = false;
  isMobileMenuOpen.value = false;
  emit('auth-success');
}

function handleMobileLogin() {
  showAuthModal.value = true;
}

function handleMobileLogout() {
  isMobileMenuOpen.value = false;
  logout();
}

onMounted(() => {
  // Set up ping interval
  pingBackend();
  pingInterval = window.setInterval(pingBackend, 10000);
});

onUnmounted(() => {
  if (pingInterval) {
    clearInterval(pingInterval);
  }
});
</script>
