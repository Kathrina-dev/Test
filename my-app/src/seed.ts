import type { Sighting } from "./types.ts";

export const seedSightings: Sighting[] = [
  { id: "place1", title: "Signal: PLACE-1", description: "Unidentified arachnid trace detected. Coordinates encrypted. Triangulate the source.", latitude: 40.7480, longitude: -73.9860, status: "rumored", confidence: 99, createdAt: "2026-08-04T18:00:00Z" },
  { id: "st-01", title: "Rooftop Movement", description: "Masked figure seen crossing the buildings.", latitude: 40.7587, longitude: -73.9851, status: "rumored", confidence: 62, createdAt: "2026-08-04T18:34:00Z" },
  { id: "st-02", title: "Rescue on 5th Avenue", description: "Confirmed report by three nearby witnesses.", latitude: 40.7546, longitude: -73.9818, status: "confirmed", confidence: 91, createdAt: "2026-08-04T18:11:00Z" },
  { id: "st-03", title: "Webbing Signal", description: "Web-like material found on a building facade.", latitude: 40.7503, longitude: -73.9874, status: "confirmed", confidence: 84, createdAt: "2026-08-04T17:48:00Z" },
  { id: "st-04", title: "Alarm Triggered", description: "Fast movement recorded near the station.", latitude: 40.7461, longitude: -73.9906, status: "rumored", confidence: 55, createdAt: "2026-08-04T17:16:00Z" },
  { id: "st-05", title: "Archive 018", description: "Old record preserved in local archive.", latitude: 40.7427, longitude: -73.9841, status: "archived", confidence: 77, createdAt: "2026-08-03T20:10:00Z" },
  { id: "st-06", title: "Park Sighting", description: "Witnesses saw a leap between structures.", latitude: 40.7369, longitude: -73.9901, status: "confirmed", confidence: 88, createdAt: "2026-08-04T16:40:00Z" },
  { id: "st-07", title: "Unusual Trace", description: "Occurrence still awaiting independent confirmation.", latitude: 40.7318, longitude: -73.9869, status: "rumored", confidence: 48, createdAt: "2026-08-04T16:02:00Z" },
  { id: "st-08", title: "Archive 011", description: "Case closed after verification.", latitude: 40.7278, longitude: -73.9951, status: "archived", confidence: 69, createdAt: "2026-08-02T22:15:00Z" },
  { id: "st-09", title: "Radar Oscillation", description: "Consistent signal detected for a few seconds.", latitude: 40.7219, longitude: -73.9894, status: "rumored", confidence: 52, createdAt: "2026-08-04T15:43:00Z" },
  { id: "st-10", title: "Confirmed Crossing", description: "Visual record validated by the community.", latitude: 40.7162, longitude: -73.9938, status: "confirmed", confidence: 94, createdAt: "2026-08-04T15:21:00Z" },
  { id: "st-11", title: "Archive 007", description: "Low priority historical record.", latitude: 40.7111, longitude: -74.0012, status: "archived", confidence: 73, createdAt: "2026-08-01T21:08:00Z" },
  { id: "st-12", title: "Bridge Movement", description: "A red figure was seen above the roadway.", latitude: 40.7064, longitude: -73.9981, status: "rumored", confidence: 59, createdAt: "2026-08-04T14:56:00Z" }
];

