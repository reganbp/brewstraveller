<template>
  <div class="relative w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner min-h-[350px]">
    <!-- Actual Leaflet map container div -->
    <div ref="mapContainer" class="w-full h-full min-h-[350px] z-10"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';
import type { Brewery, CheckIn } from '@/types';

// Props
const props = defineProps<{
  breweries: Brewery[];
  checkIns: CheckIn[];
  selectedBreweryId?: string;
  selectedTripName?: string | null;
}>();

// Emits
const emit = defineEmits<{
  (e: 'select-brewery', brewery: Brewery): void;
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let markersLayer: L.LayerGroup | null = null;
let activePolyline: L.Polyline | null = null;

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

  // Draw trip route if active
  if (props.selectedTripName) {
    drawTripRoute();
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
  drawTripRoute();
}, { deep: true });

// Center/pan map whenever selectedBreweryId updates
watch(() => props.selectedBreweryId, (newId) => {
  if (newId) {
    centerOnBrewery(newId);
  }
});

// Watch trip selection to redraw the route polyline path
watch(() => props.selectedTripName, () => {
  drawTripRoute();
});

// Watch checkins array to update route on changes
watch(() => props.checkIns, () => {
  drawTripRoute();
}, { deep: true });

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

    // Create custom popup element dynamically to attach event listeners cleanly and hardcode light-mode styling
    const popupDiv = document.createElement('div');
    popupDiv.className = 'p-1 font-sans text-slate-900';
    
    popupDiv.innerHTML = `
      <h4 class="font-extrabold text-sm mb-0.5" style="color: #0f172a !important; font-weight: 700;">${brewery.name}</h4>
      <p class="text-xs mb-2" style="color: #475569 !important;">${brewery.city}, ${brewery.state}</p>
      <div class="flex flex-col gap-1">
        ${brewery.website ? `
          <a href="${brewery.website}" target="_blank" class="text-[11px] font-semibold hover:underline inline-flex items-center gap-0.5" style="color: #2563eb !important;">
            Visit Website &rarr;
          </a>
        ` : ''}
      </div>
    `;

    const selectBtn = document.createElement('button');
    selectBtn.className = 'mt-2.5 w-full font-bold py-1.5 px-3 rounded text-[10px] uppercase tracking-wider transition-colors';
    selectBtn.style.cssText = 'background-color: #0f172a !important; color: #ffffff !important; border: none; cursor: pointer;';
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

  // Fit map bounds to contain all markers if multiple are present and no trip is selected
  if (bounds.length > 0 && !props.selectedBreweryId && !props.selectedTripName) {
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

// Draw polyline connecting visited breweries in chronological order
function drawTripRoute() {
  if (!map) return;

  // Clear existing polyline
  if (activePolyline) {
    activePolyline.remove();
    activePolyline = null;
  }

  const tripName = props.selectedTripName;
  if (!tripName) return;

  // Filter check-ins by trip name, sort chronologically ascending
  const tripCheckins = props.checkIns
    .filter((c) => c.trip_name && c.trip_name.trim().toLowerCase() === tripName.trim().toLowerCase())
    .sort((a, b) => new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime());

  if (tripCheckins.length < 1) return;

  const latLngs: L.LatLngTuple[] = [];

  tripCheckins.forEach((c) => {
    const brew = props.breweries.find((b) => b.id === c.brewery_id);
    const coordinates = brew?.location?.coordinates;
    if (coordinates && coordinates.length === 2) {
      const [lng, lat] = coordinates;
      latLngs.push([lat, lng]);
    }
  });

  if (latLngs.length < 2) return; // Need at least two points to form a connecting polyline route

  // Draw route polyline with traveler-style dashed configuration
  activePolyline = L.polyline(latLngs, {
    color: '#f59e0b', // Amber gold traveler tone
    weight: 4,
    opacity: 0.85,
    dashArray: '8, 8', // Travel map dashed pattern
    lineJoin: 'round',
    lineCap: 'round'
  }).addTo(map);

  // Automatically adjust bounds to encapsulate all brewery coordinates on this route
  map.fitBounds(activePolyline.getBounds(), {
    padding: [50, 50],
    animate: true,
    duration: 1.5
  });
}
</script>

<style>
/* Hardcode custom Leaflet popup styles explicitly to light mode */
.leaflet-popup-content-wrapper, .leaflet-popup-tip {
  background-color: #ffffff !important;
  color: #0f172a !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  border: 1px solid #e2e8f0 !important;
}

/* Ensure child text remains legible in light-mode popup context */
.leaflet-popup-content {
  color: #0f172a !important;
}
</style>
