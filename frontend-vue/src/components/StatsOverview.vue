<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <!-- Total Breweries Card -->
    <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 hover:scale-[1.02]">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">Breweries Visited</p>
          <h4 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {{ stats.total_breweries }}
          </h4>
        </div>
        <div class="rounded-lg bg-amber-500/10 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <Beer class="h-6 w-6" />
        </div>
      </div>
      <div class="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
        <span class="font-medium text-slate-900 dark:text-slate-200">Unique venues logged</span>
      </div>
    </div>

    <!-- Total Miles Card -->
    <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 hover:scale-[1.02]">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">Miles Traveled</p>
          <h4 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {{ stats.total_miles.toLocaleString() }}
          </h4>
        </div>
        <div class="rounded-lg bg-blue-500/10 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <Compass class="h-6 w-6" />
        </div>
      </div>
      <div class="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
        <span class="font-medium text-slate-900 dark:text-slate-200">Travel distance recorded</span>
      </div>
    </div>

    <!-- Tours Taken Card -->
    <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 hover:scale-[1.02]">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">Brewery Tours</p>
          <h4 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {{ stats.total_tours }}
          </h4>
        </div>
        <div class="rounded-lg bg-emerald-500/10 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Award class="h-6 w-6" />
        </div>
      </div>
      <div class="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
        <span class="font-medium text-slate-900 dark:text-slate-200">Behind-the-scenes tours</span>
      </div>
    </div>

    <!-- States Visited Card -->
    <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 hover:scale-[1.02]">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">States Visited</p>
          <h4 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {{ stats.states_visited_count }}
          </h4>
        </div>
        <div class="rounded-lg bg-purple-500/10 p-3 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
          <MapPin class="h-6 w-6" />
        </div>
      </div>
      <!-- List of states visited -->
      <div class="mt-3 flex flex-wrap gap-1">
        <span
          v-for="state in stats.states_visited"
          :key="state"
          class="inline-flex items-center rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900"
        >
          {{ state }}
        </span>
        <span v-if="stats.states_visited.length === 0" class="text-xs text-slate-400 dark:text-slate-500 italic">
          No states visited yet
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Beer, Compass, Award, MapPin } from '@lucide/vue';
import type { UserStats } from '@/types';

defineProps<{
  stats: UserStats;
}>();
</script>
