const VISIT_THRESHOLD = 50;

const sortByRecency = (coordinates) => {
  return [...coordinates].sort((a, b) => b.year - a.year || b.month - a.month);
};

const haversineDistance = (p1, p2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371e3;
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const groupCoordinates = (coordinates, maxDistance = 1000) => {
  const groups = [];

  for (const point of coordinates) {
    let addedToGroup = false;

    for (const group of groups) {
      const anchor = group[0];
      if (haversineDistance(anchor, point) <= maxDistance) {
        group.push(point);
        addedToGroup = true;
        break;
      }
    }

    if (!addedToGroup) {
      groups.push([point]); // new group
    }
  }

  return groups;
};

export function filterPoints(points, visitThreshold = VISIT_THRESHOLD) {
  const filtered = [];

  for (const point of points) {
    if (point.visit > visitThreshold) continue;

    filtered.push({
      lat: point.lat,
      lng: point.lng,
      year: point.year,
      month: point.month,
    });
  }

  if (filtered.length === 0) {
    return {
      coordinates: [],
      minDate: null,
      maxDate: null,
    };
  }

  // 1. Sort by recency
  const sorted = sortByRecency(filtered);

  // 2. Group within 1000 meters
  const groups = groupCoordinates(sorted, 1000);

  // 3. Extract primary point and place the rest in fallbacks
  const coordinatesWithFallbacks = groups.map(group => {
    const primary = group[0];
    const fallbacks = group.slice(1);
    
    return {
      ...primary,
      svVerified: 'pending',
      fallbacks: fallbacks.length > 0 ? fallbacks : undefined
    };
  });

  const timestamps = filtered.map((p) => new Date(p.year, p.month - 1));
  const minDate = new Date(Math.min(...timestamps));
  const maxDate = new Date(Math.max(...timestamps));

  return {
    coordinates: coordinatesWithFallbacks,
    minDate,
    maxDate,
  };
}
