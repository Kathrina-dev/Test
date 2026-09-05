import type { Sighting } from "./types.ts";

export const seedSightings: Sighting[] = [
  { 
    id: "loc-01", 
    title: "The White Arch", 
    description: "Someone left a strange calling card right on the waterfront promenade. If you angle yourself perfectly near the high-rise glass, you'll see a silhouette frozen mid-stride against the concrete.", 
    latitude: 35.15639, 
    longitude: 129.14111, 
    status: "confirmed", 
    confidence: 95, 
    createdAt: "2026-08-04T12:00:00Z" 
  },
  { 
    id: "loc-02", 
    title: "Slices and Panels", 
    description: "A local regular swore they saw a flash of red leap directly onto the flat roof above the storefront. It happened right where the smell of baking dough meets the latest issue arrivals.", 
    latitude: 43.02097, 
    longitude: -78.95994, 
    status: "confirmed", 
    confidence: 89, 
    createdAt: "2026-08-04T13:15:00Z" 
  },
  { 
    id: "loc-03", 
    title: "Brick and Scissors", 
    description: "A blurred figure was spotted scaling the exterior brickwork just above an old salon sign. Left a few passersby pointing up at the second story in absolute confusion before it vanished.", 
    latitude: 57.26817, 
    longitude: 9.94578, 
    status: "rumored", 
    confidence: 65, 
    createdAt: "2026-08-04T14:22:00Z" 
  },
  { 
    id: "loc-04", 
    title: "The Quiet Siding", 
    description: "An old neighborhood rumor resurfaced after a dashcam caught a split-second shadow moving vertically up a gray residential wall, completely ignoring the staircase entirely.", 
    latitude: 35.40211, 
    longitude: 136.68881, 
    status: "confirmed", 
    confidence: 92, 
    createdAt: "2026-08-04T15:40:00Z" 
  },
  { 
    id: "loc-05", 
    title: "Rafter Shadow", 
    description: "A market vendor claims something was crouching silently up in the metal framework right above the daily crowds. By the time security looked up, only a faint vibration in the beam was left.", 
    latitude: 23.35150, 
    longitude: 120.48186, 
    status: "rumored", 
    confidence: 58, 
    createdAt: "2026-08-04T16:11:00Z" 
  },
  { 
    id: "loc-06", 
    title: "Peak Performance", 
    description: "A dog wouldn't stop barking at a residential roofline. The owner looked out the window and caught the briefest glimpse of someone balanced perfectly on the sharp triangular apex of a garage door frame.", 
    latitude: 51.74075, 
    longitude: -2.19728, 
    status: "archived", 
    confidence: 74, 
    createdAt: "2026-08-03T19:45:00Z" 
  },
  { 
    id: "loc-07", 
    title: "The Tiled View", 
    description: "Footsteps were heard shuffling along the narrow ledge just adjacent to the historic gateway. Whoever it was seemed to be looking down, mapping out the pedestrian traffic below.", 
    latitude: 34.68834, 
    longitude: 135.18942, 
    status: "confirmed", 
    confidence: 97, 
    createdAt: "2026-08-04T17:02:00Z" 
  },
  { 
    id: "loc-08", 
    title: "Corner Standoff", 
    description: "A wild scene broke out right on the concrete corner under the red awning. Witnesses described it as a blur of acrobatic defense maneuvers against a handful of synchronized targets.", 
    latitude: 40.75355, 
    longitude: -73.93430, 
    status: "confirmed", 
    confidence: 99, 
    createdAt: "2026-08-04T18:55:00Z" 
  }
];
