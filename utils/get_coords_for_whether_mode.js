const fs = require("fs");

const OVERPASS_TURBO_QUERY = `
  [out:json][timeout:90];
  area["ISO3166-1"="COUNTRY_PLACEHOLDER"][admin_level=2];

  (
    node["tourism"="attraction"]["wikipedia"](area);
    node["tourism"="attraction"]["wikidata"](area);
    node["tourism"="attraction"]["image"](area);
    node["tourism"="attraction"]["name"](area);
  );
  out center;
`;
const MAXIMUM_COORDINATES_PER_COUNTRY = 100;

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const HARDCODED_LOCATIONS_FILE =
  "../frontend/src/modes/hardcoded-locations.json";

const streetViewCoverage = require("./street_view_coverage.json");
const countryCodes = Object.keys(streetViewCoverage);

async function fetchWithRetry(url, options, retries = 3, delay = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const text = await response.text();
        console.error(`HTTP error ${response.status}`);
        if (attempt === retries)
          throw new Error(`Failed after ${retries} attempts`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return response;
    } catch (err) {
      console.error(`Fetch attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function main() {
  const coordinates = [];

  for (const countryCode of countryCodes) {
    const countryCode2 = countryCode.slice(-2);
    const country = streetViewCoverage[countryCode];

    let response;
    const osmRequestStart = Date.now();
    try {
      response = await fetchWithRetry(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          body:
            "data=" +
            encodeURIComponent(
              OVERPASS_TURBO_QUERY.replace("COUNTRY_PLACEHOLDER", countryCode2)
            ),
        }
      );
    } catch (err) {
      console.error(
        `Failed to fetch Overpass data for ${country}: ${err.message}`
      );
      continue;
    }
    const osmRequestDuration = Date.now() - osmRequestStart;

    const result = await response.json();

    const coords = result.elements
      .filter((el) => el.type === "node")
      .map((el) => ({ lat: el.lat, lng: el.lon }));
    console.log(
      `${coords.length} coordinates found in ${country} (took ${osmRequestDuration} ms)`
    );

    const googleMapsRequestsStart = Date.now();
    let coordsWithStreetView = [];
    for (const coord of coords) {
      const url = `https://maps.googleapis.com/maps/api/streetview/metadata?source=outdoor&radius=150&location=${coord.lat},${coord.lng}&key=${GOOGLE_MAPS_API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.location) {
        coordsWithStreetView.push([
          Math.round(data.location.lat * 10000) / 10000,
          Math.round(data.location.lng * 10000) / 10000,
        ]);
      }

      if (coordsWithStreetView.length >= MAXIMUM_COORDINATES_PER_COUNTRY) {
        break;
      }
    }
    const googleMapsRequestsDuration = Date.now() - googleMapsRequestsStart;
    console.log(
      `${coordsWithStreetView.length} coordinates with Street View (took ${googleMapsRequestsDuration} ms)`
    );

    coordinates.push(...coordsWithStreetView);

    await new Promise((r) =>
      setTimeout(r, osmRequestDuration - googleMapsRequestsDuration)
    );
  }

  fs.writeFileSync(HARDCODED_LOCATIONS_FILE, JSON.stringify(coordinates));
}

main();
