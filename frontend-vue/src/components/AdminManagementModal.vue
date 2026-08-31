<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" @click.self="close">
      <div class="relative w-full max-w-5xl my-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-5">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <Sliders class="h-5 w-5 text-amber-500" />
            <div>
              <h3 class="text-lg font-extrabold text-white">System Data Registry</h3>
              <p class="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-0.5">
                Admin Collection: <span class="text-amber-500 font-extrabold">{{ collection }}</span>
              </p>
            </div>
          </div>
          <button
            @click="close"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Search and Actions Bar -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
          <!-- Search input -->
          <div class="relative flex-1">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              v-model="searchQuery"
              @input="debouncedFetch"
              type="text"
              placeholder="Search by ID, Name, City, or Email..."
              class="w-full h-11 rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 text-sm focus:border-amber-500 focus:outline-none text-white placeholder-slate-500"
            />
          </div>

          <!-- Total Count Badge -->
          <div class="flex items-center gap-2.5 px-4 h-11 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-400 font-semibold self-end sm:self-auto">
            <span>Total Records:</span>
            <span class="text-amber-500 font-extrabold">{{ totalRecords }}</span>
          </div>
        </div>

        <!-- Feedback Messages -->
        <p v-if="errorMsg" class="text-xs font-semibold text-rose-400 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30 animate-pulse">
          ⚠ {{ errorMsg }}
        </p>

        <!-- Loading spinner -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
          <div class="h-8 w-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Retrieving DB records...</span>
        </div>

        <!-- Empty state -->
        <div v-else-if="records.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
          <Inbox class="h-10 w-10 text-slate-750 mb-2" />
          <h4 class="text-sm font-bold text-slate-300">No records found</h4>
          <p class="text-xs text-slate-500 mt-1 max-w-xs">No entries match your search parameters in the database.</p>
        </div>

        <!-- Data Table Container -->
        <div v-else class="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 shadow-inner">
          <table class="w-full text-left border-collapse text-xs text-slate-300">
            <thead class="bg-slate-900 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th class="px-5 py-3">Document ID</th>
                <!-- Collection dynamic headers -->
                <template v-if="collection === 'users'">
                  <th class="px-5 py-3">Display Name</th>
                  <th class="px-5 py-3">Email Address</th>
                  <th class="px-5 py-3">Role Type</th>
                  <th class="px-5 py-3">Home Location</th>
                </template>
                <template v-else-if="collection === 'breweries'">
                  <th class="px-5 py-3">Brewery Name</th>
                  <th class="px-5 py-3">City / State</th>
                  <th class="px-5 py-3">Coordinates</th>
                  <th class="px-5 py-3">Website</th>
                </template>
                <template v-else-if="collection === 'checkins'">
                  <th class="px-5 py-3">Brewery ID</th>
                  <th class="px-5 py-3">Visited Date</th>
                  <th class="px-5 py-3">Rating</th>
                  <th class="px-5 py-3">Trip Name</th>
                </template>
                <template v-else-if="collection === 'trips'">
                  <th class="px-5 py-3">Trip Name</th>
                  <th class="px-5 py-3">Planned Stops</th>
                  <th class="px-5 py-3">Description</th>
                  <th class="px-5 py-3">Created Date</th>
                </template>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-850">
              <tr v-for="r in records" :key="r.id" class="hover:bg-slate-900/30 transition-colors">
                <!-- ID column -->
                <td class="px-5 py-3 font-mono text-[10px] text-slate-500 max-w-[120px] truncate" :title="r.id">
                  {{ r.id }}
                </td>

                <!-- Collection dynamic cells -->
                <!-- 1. USERS -->
                <template v-if="collection === 'users'">
                  <td class="px-5 py-3 font-bold text-slate-200">{{ r.full_name }}</td>
                  <td class="px-5 py-3 text-slate-400">{{ r.email }}</td>
                  <td class="px-5 py-3">
                    <span :class="['px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase', r.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-800 text-slate-400']">
                      {{ r.role }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-slate-500 font-semibold">{{ r.home_city || '—' }}</td>
                </template>

                <!-- 2. BREWERIES -->
                <template v-if="collection === 'breweries'">
                  <td class="px-5 py-3 font-bold text-slate-200 max-w-[160px] truncate" :title="r.name">{{ r.name }}</td>
                  <td class="px-5 py-3 text-slate-400 font-semibold">{{ r.city }}, {{ r.state }}</td>
                  <td class="px-5 py-3 font-mono text-[10px] text-slate-500">
                    [{{ r.location?.coordinates?.[0]?.toFixed(2) }}, {{ r.location?.coordinates?.[1]?.toFixed(2) }}]
                  </td>
                  <td class="px-5 py-3 text-slate-500 max-w-[140px] truncate" :title="r.website">
                    {{ r.website || '—' }}
                  </td>
                </template>

                <!-- 3. CHECK-INS -->
                <template v-if="collection === 'checkins'">
                  <td class="px-5 py-3 font-mono text-[10px] text-slate-500 max-w-[120px] truncate" :title="r.brewery_id">{{ r.brewery_id }}</td>
                  <td class="px-5 py-3 text-slate-400">{{ formatDateTime(r.visited_at) }}</td>
                  <td class="px-5 py-3 text-amber-500 font-extrabold">★ {{ r.rating?.toFixed(1) }}</td>
                  <td class="px-5 py-3 text-slate-500 font-bold truncate max-w-[120px]">{{ r.trip_name || '—' }}</td>
                </template>

                <!-- 4. TRIPS -->
                <template v-if="collection === 'trips'">
                  <td class="px-5 py-3 font-extrabold text-slate-200 max-w-[140px] truncate">{{ r.name }}</td>
                  <td class="px-5 py-3 font-semibold text-slate-400">
                    {{ r.planned_brewery_ids?.length || 0 }} venues
                  </td>
                  <td class="px-5 py-3 text-slate-500 italic max-w-[160px] truncate" :title="r.description">
                    "{{ r.description || 'No notes' }}"
                  </td>
                  <td class="px-5 py-3 text-slate-500 font-mono text-[10px]">{{ formatDate(r.created_at) }}</td>
                </template>

                <!-- Actions dock -->
                <td class="px-5 py-3 text-right space-x-2 whitespace-nowrap" @click.stop>
                  <!-- Toggle Admin (Only for Users) -->
                  <button
                    v-if="collection === 'users'"
                    type="button"
                    @click="toggleAdminRole(r)"
                    :class="[
                      'px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer h-7',
                      r.role === 'admin'
                        ? 'bg-rose-950/20 text-rose-400 hover:bg-rose-950/30'
                        : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    ]"
                  >
                    {{ r.role === 'admin' ? 'Revoke Admin' : 'Make Admin' }}
                  </button>

                  <!-- Inline JSON fields editor -->
                  <button
                    type="button"
                    @click="openJsonEditor(r)"
                    class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold h-7 cursor-pointer transition-colors"
                  >
                    Edit JSON
                  </button>

                  <!-- Purge Button -->
                  <button
                    type="button"
                    @click="confirmDelete(r)"
                    class="px-2.5 py-1 bg-rose-950/20 hover:bg-rose-950/35 text-rose-500 rounded text-[10px] font-bold h-7 cursor-pointer transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalRecords > limit" class="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
          <span class="text-slate-500 font-semibold">
            Showing {{ skip + 1 }} - {{ Math.min(skip + limit, totalRecords) }} of {{ totalRecords }}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="prevPage"
              :disabled="skip === 0"
              class="px-3.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 disabled:opacity-30 text-slate-300 h-9 flex items-center font-bold"
            >
              Previous
            </button>
            <button
              type="button"
              @click="nextPage"
              :disabled="skip + limit >= totalRecords"
              class="px-3.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 disabled:opacity-30 text-slate-300 h-9 flex items-center font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sub JSON Inline Schema Editor Dialog overlay -->
    <div v-if="showJsonEditor" class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" @click.self="showJsonEditor = false">
      <div class="relative w-full max-w-lg bg-slate-900 border border-slate-750 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
        <h4 class="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
          <Sliders class="h-4.5 w-4.5 text-amber-500" /> Inline JSON Document Editor
        </h4>
        <p class="text-[10px] font-mono text-slate-500">ID: {{ activeEditRecord?.id }}</p>

        <p v-if="jsonErrorMsg" class="text-[11px] text-rose-400 bg-rose-950/20 p-2 border border-rose-900/30 rounded-lg">
          ⚠ {{ jsonErrorMsg }}
        </p>

        <textarea
          v-model="activeEditJson"
          rows="12"
          class="w-full font-mono text-xs p-3 rounded-xl border border-slate-750 bg-slate-950 text-emerald-400 focus:outline-none focus:border-amber-500"
        ></textarea>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showJsonEditor = false"
            class="px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="saveJsonEdits"
            class="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl text-xs font-bold text-white shadow"
          >
            Save Fields
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal overlay -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" @click.self="showDeleteConfirm = false">
      <div class="relative w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <Trash class="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h4 class="text-base font-extrabold text-white">Purge database entry?</h4>
          <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
            This action will permanently delete this record from MongoDB. This action is irreversible.
          </p>
        </div>
        <div class="flex items-center gap-3 pt-2">
          <button
            type="button"
            @click="showDeleteConfirm = false"
            class="flex-1 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-400"
          >
            Keep Record
          </button>
          <button
            type="button"
            @click="purgeRecord"
            class="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white shadow"
          >
            Purge Permanently
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Sliders, X, Search, Inbox, Trash } from '@lucide/vue';
import api from '@/services/api';

// Props
const props = defineProps<{
  isOpen: boolean;
  collection: string; // users, breweries, checkins, trips
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const loading = ref(false);
const errorMsg = ref<string | null>(null);

// Table records and pagination state
const records = ref<any[]>([]);
const totalRecords = ref(0);
const searchQuery = ref('');
const limit = ref(15);
const skip = ref(0);

// Sub json editor state
const showJsonEditor = ref(false);
const activeEditRecord = ref<any | null>(null);
const activeEditJson = ref('');
const jsonErrorMsg = ref<string | null>(null);

// Sub delete state
const showDeleteConfirm = ref(false);
const activeDeleteRecord = ref<any | null>(null);

let debounceTimer: number | null = null;

// Watch collection changes to trigger fetches
watch(() => props.collection, () => {
  skip.value = 0;
  searchQuery.value = '';
  errorMsg.value = null;
  fetchRecords();
}, { immediate: true });

function close() {
  records.value = [];
  totalRecords.value = 0;
  searchQuery.value = '';
  skip.value = 0;
  errorMsg.value = null;
  emit('close');
}

async function fetchRecords() {
  if (!props.isOpen || !props.collection) return;
  loading.value = true;
  errorMsg.value = null;

  try {
    const res = await api.get(`/admin/collections/${props.collection}`, {
      params: {
        q: searchQuery.value.trim() || undefined,
        limit: limit.value,
        skip: skip.value
      }
    });

    records.value = res.data.data || [];
    totalRecords.value = res.data.total || 0;
  } catch (err: any) {
    console.error('Failed to load collection records:', err);
    errorMsg.value = err.response?.data?.message || 'Access denied or failed to load administrator resources.';
    records.value = [];
    totalRecords.value = 0;
  } finally {
    loading.value = false;
  }
}

function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    skip.value = 0;
    fetchRecords();
  }, 400);
}

function prevPage() {
  if (skip.value > 0) {
    skip.value = Math.max(0, skip.value - limit.value);
    fetchRecords();
  }
}

function nextPage() {
  if (skip.value + limit.value < totalRecords.value) {
    skip.value += limit.value;
    fetchRecords();
  }
}

// Formatters
function formatDate(isoStr: string) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoStr;
  }
}

function formatDateTime(isoStr: string) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoStr;
  }
}

// Administrator collection triggers
async function toggleAdminRole(userRecord: any) {
  try {
    const isNowAdmin = userRecord.role !== 'admin';
    await api.put(`/admin/collections/users/${userRecord.id}`, {
      is_admin: isNowAdmin
    });
    fetchRecords();
    emit('success');
  } catch (err: any) {
    console.error('Failed to toggle admin role:', err);
    errorMsg.value = err.response?.data?.message || 'Failed to update user privileges.';
  }
}

function openJsonEditor(record: any) {
  jsonErrorMsg.value = null;
  activeEditRecord.value = record;
  activeEditJson.value = JSON.stringify(record, null, 2);
  showJsonEditor.value = true;
}

async function saveJsonEdits() {
  jsonErrorMsg.value = null;
  if (!activeEditRecord.value) return;

  try {
    // Parse JSON
    const parsed = JSON.parse(activeEditJson.value);
    
    await api.put(`/admin/collections/${props.collection}/${activeEditRecord.value.id}`, parsed);
    
    showJsonEditor.value = false;
    activeEditRecord.value = null;
    activeEditJson.value = '';
    
    fetchRecords();
    emit('success'); // Refresh dashboard values
  } catch (err: any) {
    console.error('Failed to parse or save JSON edits:', err);
    jsonErrorMsg.value = err.message || 'Syntax error or network rejection saving JSON payload.';
  }
}

function confirmDelete(record: any) {
  activeDeleteRecord.value = record;
  showDeleteConfirm.value = true;
}

async function purgeRecord() {
  if (!activeDeleteRecord.value) return;
  errorMsg.value = null;

  try {
    await api.delete(`/admin/collections/${props.collection}/${activeDeleteRecord.value.id}`);
    showDeleteConfirm.value = false;
    activeDeleteRecord.value = null;
    fetchRecords();
    emit('success');
  } catch (err: any) {
    console.error('Failed to delete record:', err);
    errorMsg.value = err.response?.data?.message || 'Failed to purge database entry.';
    showDeleteConfirm.value = false;
    activeDeleteRecord.value = null;
  }
}
</script>
