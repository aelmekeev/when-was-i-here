export function parseTimeline(data) {
  const uniquePoints = new Map();
  const visitCounts = new Map();

  for (const location of data.semanticSegments) {
    const point = extractPoint(location);
    if (!point) continue;

    const key = `${point.lat},${point.lng}`;
    visitCounts.set(key, (visitCounts.get(key) || 0) + 1);

    const existing = uniquePoints.get(key);
    if (!existing || new Date(point.date) > new Date(existing.date)) {
      uniquePoints.set(key, {
        ...point,
        visit: visitCounts.get(key),
      });
    }
  }

  return Array.from(uniquePoints.entries()).map(
    ([, { lat, lng, date, visit }]) => {
      const [year, month] = date.split("-");
      return {
        lat,
        lng,
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        visit: visit || 1,
      };
    }
  );
}

export function extractPoint(location) {
  const candidate = location?.visit?.topCandidate?.placeLocation?.latLng;
  const date = location?.startTime?.split("T")[0];

  if (!candidate || !date) return null;

  const [rawLat, rawLng] = candidate.split(", ");

  const lat = roundCoord(rawLat);
  const lng = roundCoord(rawLng);

  if (isNaN(lat) || isNaN(lng)) return null;

  return {
    lat,
    lng,
    date,
  };
}

function roundCoord(coordStr) {
  const numeric = parseFloat(coordStr?.replace("°", ""));
  return Math.round(numeric * 1e4) / 1e4;
}
