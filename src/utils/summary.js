import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import geoJSON from "./geo.json";

// Approximate grouping logic
export function getTimelineSummary(filteredPoints, groupDistanceMeters = 500) {
  const groups = [];
  const countries = new Set();

  for (const point of filteredPoints.coordinates) {
    const country = getCountryFromCoords(point.lat, point.lng);

    if (country.code === "unknown" || !country.sv) {
      continue;
    }

    countries.add(country.code);

    const isNearExisting = groups.some(
      (g) => haversineDistance(g, point) < groupDistanceMeters
    );

    if (!isNearExisting) {
      groups.push(point);
    }
  }

  return {
    countriesEstimate: Array.from(countries).length,
    pointsEstimate: groups.length,
  };
}

// Simple Haversine distance (in meters)
function haversineDistance(p1, p2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371e3; // meters

  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);

  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCountryFromCoords(lat, lng) {
  const pt = point([lng, lat]);

  for (const feature of geoJSON.features) {
    if (booleanPointInPolygon(pt, feature)) {
      return {
        code: feature.iso_a2,
        name: feature.name,
        sv: feature.sv,
      };
    }
  }

  // If no country found, return unknown
  return {
    code: "unknown",
    name: "unknown",
    sv: false,
  };
}