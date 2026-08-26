<template>
  <div class="relative w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner min-h-[350px]">
    <!-- Actual Leaflet map container div -->
    <div ref="mapContainer" class="w-full h-full min-h-[350px] z-10"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';
import type { Brewery } from '@/types';

// Props
const props = defineProps<{
  breweries: Brewery[];
  selectedBreweryId?: string;
}>();

// Emits
const emit = defineEmits<{
  (e: 'select-brewery', brewery: Brewery): void;
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let markersLayer: L.LayerGroup | null = null;

// Fix default Leaflet marker icon asset path issues in Vite/Webpack bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Initialize Leaflet Map
onMounted(() => {
  if (!mapContainer.value) return;

  // Default coordinate centering: California/West Coast region (e.g. Sonoma area)
  map = L.map(mapContainer.value, {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView([38.2975, -122.4580], 8);

  // Add OpenStreetMap Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Layer group for managing dynamic markers
  markersLayer = L.layerGroup().addTo(map);

  // Render initial markers
  updateMarkers();

  // If a brewery was already selected, center on it immediately
  if (props.selectedBreweryId) {
    centerOnBrewery(props.selectedBreweryId, true);
  }
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

// Update markers whenever breweries array prop updates
watch(() => props.breweries, () => {
  updateMarkers();
}, { deep: true });

// Center/pan map whenever selectedBreweryId updates
watch(() => props.selectedBreweryId, (newId) => {
  if (newId) {
    centerOnBrewery(newId);
  }
});

function updateMarkers() {
  if (!map || !markersLayer) return;

  // Clear existing markers
  markersLayer.clearLayers();

  if (props.breweries.length === 0) return;

  const bounds: L.LatLngTuple[] = [];

  props.breweries.forEach((brewery) => {
    const coordinates = brewery.location?.coordinates;
    if (!coordinates || coordinates.length !== 2) return;

    const [lng, lat] = coordinates;
    bounds.push([lat, lng]);

    // Create custom popup element dynamically to attach event listeners cleanly
    const popupDiv = document.createElement('div');
    popupDiv.className = 'p-1 font-sans text-slate-800';
    
    popupDiv.innerHTML = `
      <h4 class="font-extrabold text-sm mb-0.5">${brewery.name}</h4>
      <p class="text-xs text-slate-500 mb-2">${brewery.city}, ${brewery.state}</p>
      <div class="flex flex-col gap-1">
        ${brewery.website ? `
          <a href="${brewery.website}" target="_blank" class="text-[11px] text-amber-600 hover:text-amber-700 font-semibold hover:underline inline-flex items-center gap-0.5">
            Visit Website &rarr;
          </a>
        ` : ''}
      </div>
    `;

    const selectBtn = document.createElement('button');
    selectBtn.className = 'mt-2.5 w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-bold py-1.5 px-3 rounded text-[10px] uppercase tracking-wider transition-colors';
    selectBtn.innerText = 'View Details';
    selectBtn.onclick = () => {
      emit('select-brewery', brewery);
    };
    popupDiv.appendChild(selectBtn);

    // Create marker
    const marker = L.marker([lat, lng])
      .bindPopup(popupDiv)
      .on('click', () => {
        emit('select-brewery', brewery);
      });

    markersLayer!.addLayer(marker);
  });

  // Fit map bounds to contain all markers if multiple are present
  if (bounds.length > 0 && !props.selectedBreweryId) {
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

function centerOnBrewery(id: string, immediate = false) {
  if (!map) return;

  const b = props.breweries.find((brew) => brew.id === id);
  const coordinates = b?.location?.coordinates;
  if (!coordinates || coordinates.length !== 2) return;

  const [lng, lat] = coordinates;

  if (immediate) {
    map.setView([lat, lng], 13);
  } else {
    map.flyTo([lat, lng], 13, {
      duration: 1.2
    });
  }

  // Open marker popup dynamically if matching marker exists
  if (markersLayer) {
    markersLayer.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const latLng = layer.getLatLng();
        if (latLng.lat === lat && latLng.lng === lng) {
          layer.openPopup();
        }
      }
    });
  }
}
</script>

<style>
/* Leaflet custom popup typography fix to match Tailwind styles */
.leaflet-popup-content-wrapper {
  border-radius: 0.75rem !important;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
  border: 1px solid #e2e8f0;
}
.dark .leaflet-popup-content-wrapper {
  background-color: #020617 !important;
  color: #f8fafc !important;
  border: 1px solid #1e293b;
}
.leaflet-popup-tip {
  border: 1px solid #e2e8f0;
}
.dark .leaflet-popup-tip {
  background-color: #020617 !important;
}
.dark .leaflet-popup-content {
  color: #f8fafc !important;
}
</style>
