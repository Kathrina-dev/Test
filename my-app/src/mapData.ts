import type { Feature, FeatureCollection, Geometry } from "geojson";

export function generateCityGeoJSON(): FeatureCollection<Geometry> {
  const features: Feature<Geometry>[] = [];

  // 1. Water background covers everything, so land is drawn on top.
  // 2. Main Landmasses
  const manhattanPoly: [number, number][] = [
    [-74.015, 40.700], // Battery Park
    [-74.017, 40.712],
    [-74.012, 40.730],
    [-74.010, 40.750],
    [-73.998, 40.770],
    [-73.982, 40.795],
    [-73.955, 40.830],
    [-73.930, 40.875], // Inwood
    [-73.925, 40.870],
    [-73.933, 40.850],
    [-73.935, 40.830],
    [-73.938, 40.800],
    [-73.950, 40.780],
    [-73.960, 40.760],
    [-73.972, 40.735],
    [-73.976, 40.715],
    [-73.985, 40.710],
    [-74.000, 40.702],
    [-74.015, 40.700],
  ];

  features.push({
    type: "Feature",
    properties: { kind: "land", name: "Manhattan" },
    geometry: { type: "Polygon", coordinates: [manhattanPoly] },
  });

  const brooklynQueensPoly: [number, number][] = [
    [-74.000, 40.700],
    [-73.985, 40.705],
    [-73.960, 40.710],
    [-73.940, 40.740],
    [-73.920, 40.780],
    [-73.880, 40.800],
    [-73.850, 40.760],
    [-73.850, 40.600],
    [-74.050, 40.600],
    [-74.040, 40.650],
    [-74.010, 40.680],
    [-74.000, 40.700],
  ];

  features.push({
    type: "Feature",
    properties: { kind: "land", name: "Brooklyn/Queens" },
    geometry: { type: "Polygon", coordinates: [brooklynQueensPoly] },
  });

  const newJerseyPoly: [number, number][] = [
    [-74.022, 40.700],
    [-74.025, 40.720],
    [-74.028, 40.750],
    [-74.010, 40.800],
    [-73.970, 40.875],
    [-74.200, 40.875],
    [-74.200, 40.700],
    [-74.022, 40.700],
  ];

  features.push({
    type: "Feature",
    properties: { kind: "land", name: "New Jersey" },
    geometry: { type: "Polygon", coordinates: [newJerseyPoly] },
  });

  // Central Park
  const centralParkPoly: [number, number][] = [
    [-73.981, 40.764],
    [-73.973, 40.767],
    [-73.949, 40.797],
    [-73.958, 40.800],
    [-73.981, 40.764],
  ];

  features.push({
    type: "Feature",
    properties: { kind: "park", name: "Central Park" },
    geometry: { type: "Polygon", coordinates: [centralParkPoly] },
  });

  // Prospect Park
  const prospectParkPoly: [number, number][] = [
    [-73.978, 40.660],
    [-73.960, 40.660],
    [-73.960, 40.675],
    [-73.978, 40.675],
    [-73.978, 40.660],
  ];
  features.push({
    type: "Feature",
    properties: { kind: "park", name: "Prospect Park" },
    geometry: { type: "Polygon", coordinates: [prospectParkPoly] },
  });

  // 3. Main Expressways / Highways (Curved shorelines)
  // FDR Drive (East side)
  features.push({
    type: "Feature",
    properties: { kind: "highway", name: "FDR Drive" },
    geometry: {
      type: "LineString",
      coordinates: [
        [-74.012, 40.700],
        [-73.975, 40.712],
        [-73.971, 40.732],
        [-73.958, 40.762],
        [-73.948, 40.782],
        [-73.934, 40.805],
        [-73.930, 40.850],
      ],
    },
  });

  // West Side Highway / Henry Hudson Pkwy
  features.push({
    type: "Feature",
    properties: { kind: "highway", name: "West Side Highway" },
    geometry: {
      type: "LineString",
      coordinates: [
        [-74.015, 40.702],
        [-74.014, 40.725],
        [-74.008, 40.755],
        [-73.992, 40.780],
        [-73.968, 40.815],
        [-73.948, 40.850],
        [-73.928, 40.875],
      ],
    },
  });

  // 4. Broadway (Diagonal artery)
  features.push({
    type: "Feature",
    properties: { kind: "major_road", name: "Broadway" },
    geometry: {
      type: "LineString",
      coordinates: [
        [-74.013, 40.704],
        [-74.002, 40.718],
        [-73.991, 40.732],
        [-73.987, 40.752],
        [-73.981, 40.768],
        [-73.965, 40.795],
        [-73.940, 40.835],
        [-73.925, 40.870],
      ],
    },
  });

  // 5. Avenues (North-South Grid)
  const aveLongitudes = [
    { name: "11th Ave", lng: -74.004 },
    { name: "10th Ave", lng: -74.000 },
    { name: "9th Ave", lng: -73.996 },
    { name: "8th Ave", lng: -73.992 },
    { name: "7th Ave", lng: -73.988 },
    { name: "6th Ave", lng: -73.984 },
    { name: "5th Ave", lng: -73.980 },
    { name: "Madison Ave", lng: -73.976 },
    { name: "Park Ave", lng: -73.973 },
    { name: "Lexington Ave", lng: -73.970 },
    { name: "3rd Ave", lng: -73.966 },
    { name: "2nd Ave", lng: -73.962 },
    { name: "1st Ave", lng: -73.957 },
    { name: "York Ave", lng: -73.952 },
  ];

  aveLongitudes.forEach((ave) => {
    features.push({
      type: "Feature",
      properties: { kind: "major_road", name: ave.name },
      geometry: {
        type: "LineString",
        coordinates: [
          [ave.lng - 0.012, 40.705],
          [ave.lng, 40.760],
          [ave.lng + 0.020, 40.840],
        ],
      },
    });
  });

  // 6. Major Cross Streets (East-West Grid)
  const majorCrossStreets = [
    { name: "Canal St", lat: 40.718 },
    { name: "Houston St", lat: 40.725 },
    { name: "14th St", lat: 40.736 },
    { name: "23rd St", lat: 40.742 },
    { name: "34th St", lat: 40.750 },
    { name: "42nd St", lat: 40.756 },
    { name: "57th St", lat: 40.765 },
    { name: "72nd St", lat: 40.776 },
    { name: "86th St", lat: 40.786 },
    { name: "96th St", lat: 40.793 },
    { name: "110th St", lat: 40.803 },
    { name: "125th St", lat: 40.814 },
    { name: "145th St", lat: 40.828 },
  ];

  majorCrossStreets.forEach((street) => {
    features.push({
      type: "Feature",
      properties: { kind: "major_road", name: street.name },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.015 + (street.lat - 40.70) * 0.25, street.lat],
          [-73.930 + (street.lat - 40.70) * 0.25, street.lat + 0.005],
        ],
      },
    });
  });

  // 7. Dense Cross Streets (Numbered Grid)
  for (let lat = 40.710; lat <= 40.840; lat += 0.0022) {
    const isMajor = majorCrossStreets.some((s) => Math.abs(s.lat - lat) < 0.001);
    if (isMajor) continue;
    const startLng = -74.015 + (lat - 40.70) * 0.22;
    const endLng = -73.940 + (lat - 40.70) * 0.22;
    features.push({
      type: "Feature",
      properties: { kind: "minor_road" },
      geometry: {
        type: "LineString",
        coordinates: [
          [startLng, lat],
          [endLng, lat + 0.004],
        ],
      },
    });
  }

  // 8. Brooklyn & Queens Radial / Grid Lines
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
    const r1 = 0.01;
    const r2 = 0.12;
    const cx = -73.95;
    const cy = 40.67;
    features.push({
      type: "Feature",
      properties: { kind: "minor_road" },
      geometry: {
        type: "LineString",
        coordinates: [
          [cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1],
          [cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2],
        ],
      },
    });
  }

  // Ring roads for Brooklyn
  [0.02, 0.04, 0.065, 0.09, 0.12].forEach((radius) => {
    const ringCoords: [number, number][] = [];
    const cx = -73.95;
    const cy = 40.67;
    for (let step = 0; step <= 24; step += 1) {
      const theta = (step / 24) * Math.PI * 2;
      ringCoords.push([cx + Math.cos(theta) * radius * 1.3, cy + Math.sin(theta) * radius]);
    }
    features.push({
      type: "Feature",
      properties: { kind: "minor_road" },
      geometry: { type: "LineString", coordinates: ringCoords },
    });
  });

  // 9. Bridges
  const bridges: { name: string; coords: [number, number][] }[] = [
    { name: "Brooklyn Bridge", coords: [[-74.000, 40.706], [-73.990, 40.700]] },
    { name: "Manhattan Bridge", coords: [[-73.997, 40.713], [-73.984, 40.704]] },
    { name: "Williamsburg Bridge", coords: [[-73.980, 40.718], [-73.963, 40.713]] },
    { name: "Queensboro Bridge", coords: [[-73.961, 40.757], [-73.945, 40.753]] },
    { name: "RFK / Triborough Bridge", coords: [[-73.935, 40.780], [-73.920, 40.778]] },
    { name: "George Washington Bridge", coords: [[-73.951, 40.851], [-73.966, 40.852]] },
  ];

  bridges.forEach((bridge) => {
    features.push({
      type: "Feature",
      properties: { kind: "bridge", name: bridge.name },
      geometry: { type: "LineString", coordinates: bridge.coords },
    });
  });

  // 10. Building Blocks (Rectangular grid blocks in Midtown & Downtown)
  for (let lat = 40.712; lat < 40.810; lat += 0.0035) {
    for (let lIndex = 0; lIndex < aveLongitudes.length - 1; lIndex += 1) {
      const a1 = aveLongitudes[lIndex].lng + (lat - 40.70) * 0.22;
      const a2 = aveLongitudes[lIndex + 1].lng + (lat - 40.70) * 0.22;
      const marginLng = (a2 - a1) * 0.15;
      const marginLat = 0.0005;

      const minX = a1 + marginLng;
      const maxX = a2 - marginLng;
      const minY = lat + marginLat;
      const maxY = lat + 0.0035 - marginLat;

      // Skip blocks inside Central Park
      const blockCenterLat = (minY + maxY) / 2;
      const blockCenterLng = (minX + maxX) / 2;
      if (blockCenterLng >= -73.981 && blockCenterLng <= -73.949 && blockCenterLat >= 40.764 && blockCenterLat <= 40.800) {
        continue;
      }

      features.push({
        type: "Feature",
        properties: { kind: "building" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [minX, minY],
            [maxX, minY],
            [maxX, maxY],
            [minX, maxY],
            [minX, minY],
          ]],
        },
      });
    }
  }

  // 11. Global Continents (Simple Outlines for World Mode)
  const worldContinents: [number, number][][] = [
    // North America
    [[-165, 65], [-140, 70], [-100, 75], [-60, 60], [-55, 45], [-75, 35], [-80, 25], [-90, 15], [-105, 20], [-120, 35], [-130, 50], [-165, 65]],
    // South America
    [[-80, 10], [-60, 10], [-35, -5], [-40, -22], [-55, -45], [-70, -55], [-75, -45], [-80, -15], [-80, 10]],
    // Europe
    [[-10, 36], [0, 42], [15, 45], [30, 42], [40, 55], [30, 70], [10, 65], [-10, 60], [-10, 36]],
    // Africa
    [[-18, 35], [10, 37], [32, 30], [42, 10], [51, 10], [40, -15], [35, -35], [20, -35], [10, -5], [-15, 12], [-18, 35]],
    // Asia
    [[40, 55], [60, 65], [90, 75], [140, 70], [170, 60], [140, 35], [120, 25], [100, 10], [80, 8], [60, 25], [40, 30], [40, 55]],
    // Australia
    [[113, -15], [135, -12], [153, -25], [150, -38], [135, -35], [115, -35], [113, -15]],
  ];

  worldContinents.forEach((poly, index) => {
    features.push({
      type: "Feature",
      properties: { kind: "world_land", id: index },
      geometry: { type: "Polygon", coordinates: [poly] },
    });
  });

  return {
    type: "FeatureCollection",
    features,
  };
}
