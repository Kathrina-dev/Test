import type { Sighting } from "./types.ts";

export const seedSightings: Sighting[] = [
  { 
    id: "place1", 
    title: "The White Arch", 
    description: "Someone left a strange calling card right on the waterfront promenade. If you angle yourself perfectly near the high-rise glass, you'll see a silhouette frozen mid-stride against the concrete.",
    latitude: 40.7585,
    longitude: -73.9950,
    status: "confirmed", 
    confidence: 95, 
    createdAt: "2026-08-04T12:00:00Z" 
  },
  { 
    id: "place2", 
    title: "Slices and Panels", 
    description: "A local regular swore they saw a flash of red leap directly onto the flat roof above the storefront. It happened right where the smell of baking dough meets the latest issue arrivals.", 
    latitude: 40.7530,
    longitude: -73.9760,
    status: "confirmed", 
    confidence: 89, 
    createdAt: "2026-08-04T13:15:00Z" 
  },
  { 
    id: "place3", 
    title: "Brick and Scissors", 
    description: "A blurred figure was spotted scaling the exterior brickwork just above an old salon sign. Left a few passersby pointing up at the second story in absolute confusion before it vanished.", 
    latitude: 40.7480,
    longitude: -74.0010,
    status: "rumored", 
    confidence: 65, 
    createdAt: "2026-08-04T14:22:00Z" 
  },
  { 
    id: "place4", 
    title: "The Quiet Siding", 
    description: "An old neighborhood rumor resurfaced after a dashcam caught a split-second shadow moving vertically up a gray residential wall, completely ignoring the staircase entirely.", 
    latitude: 40.7440,
    longitude: -73.9800,
    status: "confirmed", 
    confidence: 92, 
    createdAt: "2026-08-04T15:40:00Z" 
  },
  { 
    id: "place5", 
    title: "Rafter Shadow", 
    description: "A market vendor claims something was crouching silently up in the metal framework right above the daily crowds. By the time security looked up, only a faint vibration in the beam was left.", 
    latitude: 40.7390,
    longitude: -73.9975,
    status: "rumored", 
    confidence: 58, 
    createdAt: "2026-08-04T16:11:00Z" 
  },
  { 
    id: "place6", 
    title: "Peak Performance", 
    description: "A dog wouldn't stop barking at a residential roofline. The owner looked out the window and caught the briefest glimpse of someone balanced perfectly on the sharp triangular apex of a garage door frame.", 
    latitude: 40.7350,
    longitude: -73.9785,
    status: "archived", 
    confidence: 74, 
    createdAt: "2026-08-03T19:45:00Z" 
  },
  { 
    id: "place7", 
    title: "The Tiled View", 
    description: "Footsteps were heard shuffling along the narrow ledge just adjacent to the historic gateway. Whoever it was seemed to be looking down, mapping out the pedestrian traffic below.", 
    latitude: 40.7300,
    longitude: -73.9900,
    status: "confirmed", 
    confidence: 97, 
    createdAt: "2026-08-04T17:02:00Z" 
  },
  { 
    id: "place8", 
    title: "Corner Standoff", 
    description: "A wild scene broke out right on the concrete corner under the red awning. Witnesses described it as a blur of acrobatic defense maneuvers against a handful of synchronized targets.", 
    latitude: 40.7555,
    longitude: -73.9680,
    status: "confirmed", 
    confidence: 99, 
    createdAt: "2026-08-04T18:55:00Z" 
  }
];
