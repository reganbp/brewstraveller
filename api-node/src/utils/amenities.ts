export const CANONICAL_AMENITIES = [
  { slug: "dog_friendly", label: "Dog Friendly" },
  { slug: "outdoor_patio", label: "Outdoor Patio" },
  { slug: "food_trucks", label: "Food Trucks" },
  { slug: "serves_food", label: "Serves Food" },
  { slug: "live_music", label: "Live Music" },
  { slug: "trivia_night", label: "Trivia Night" },
  { slug: "wifi", label: "Free Wi-Fi" },
  { slug: "kid_friendly", label: "Kid Friendly" },
  { slug: "wheelchair_accessible", label: "Wheelchair Accessible" },
  { slug: "merchandise", label: "Merchandise & Swag" },
  { slug: "guest_taps", label: "Guest Taps" },
  { slug: "tours", label: "Brewery Tours" },
  { slug: "cider_options", label: "Cider/Wine Options" },
];

export function getLabelForSlug(slug: string): string {
  const found = CANONICAL_AMENITIES.find((a) => a.slug === slug);
  if (found) return found.label;

  // Humanize if not found in canonical list
  return slug
    .split(/[_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
