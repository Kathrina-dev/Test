export type SightingStatus = "confirmed" | "rumored" | "archived";

export type Sighting = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: SightingStatus;
  confidence: number;
  createdAt: string;
};
