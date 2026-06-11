import hardcodedLocations from './hardcoded-locations.json'; // Your curated false samples
import { computeDistanceKm } from '../utils/distance';
import styles from './whether.module.css';
import commonStyles from './common.module.css';

let streetView = null;

export function initRound({ location, streetViewRef, setGuessMap }) {
  if (!location) return;

  // Street view
  streetView = new window.google.maps.StreetViewPanorama(streetViewRef.current, {
    position: location,
    source: window.google.maps.StreetViewSource.OUTDOOR,
    pov: { heading: 165, pitch: 5 },
    zoom: 0,
    disableDefaultUI: true,
    showRoadLabels: false,
    linksControl: false,
    motionTracking: false,
  });

  setGuessMap(null); // Not used in this mode
}

/**
 * Decide the next "isUserLocation" online (no prebuilt schedule).
 * Keeps the final total within [minUser, maxUser] while staying probabilistic.
 */
export function decideNextGuardrailed({
  roundsSoFar,            // i (0-based before placing next)
  totalRounds = 10,
  userCount,              // U so far
  minUser = 3,
  maxUser = 6,
  baseP = 0.5,
  rng = Math.random,
}) {
  const played = roundsSoFar;
  const remaining = totalRounds - played;
  const U = userCount;

  // If no rounds left (shouldn't call), just default false
  if (remaining <= 0) return false;

  // Hard guardrails to preserve feasibility
  // If we MUST pick user now to still reach minUser:
  if (U + (remaining - 1) < minUser) return true;
  // If picking user now would make it impossible to stay ≤ maxUser:
  if (U + 1 > maxUser) return false;

  // Soft steering: aim for the midpoint of [minUser, maxUser]
  const targetFinal = (minUser + maxUser) / 2;
  const targetRemainingUsers = targetFinal - U;       // can be fractional
  const targetRateThisStep = targetRemainingUsers / remaining;

  // Blend base coin with steering toward target rate
  const p = clamp(0.25, 0.75, 0.7 * baseP + 0.3 * targetRateThisStep);

  return rng() < p;
}

function clamp(lo, hi, x) { return Math.max(lo, Math.min(hi, x)); }

export function selectNextLocation({ userLocations, usedIndexes, currentRound, totalRounds }) {
  const isUserLocation = decideNextGuardrailed({
    roundsSoFar: currentRound,
    totalRounds,
    userCount: usedIndexes.length,
  });

  if (isUserLocation) {
    let index;
    do {
      index = Math.floor(Math.random() * userLocations.length);
    } while (usedIndexes.includes(index));

    return {
      location: userLocations[index],
      isFromUser: true,
      index,
    };
  } else {
    // Pick a hardcoded location far enough from any user location
    const candidates = hardcodedLocations.filter((hardcoded) =>
      userLocations.every(
        (user) =>
          computeDistanceKm(user.lat, user.lng, hardcoded[0], hardcoded[1]) > 25
      )
    );

    const location = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      location: { lat: location[0], lng: location[1] },
      isFromUser: false,
      index: null, // no index to track
    };
  }
}

export function submitGuess({ userSaidYes, actualIsFromUser, location, onResult, resultMapRef }) {
  const correct = userSaidYes === actualIsFromUser;

  setTimeout(() => {
    if (resultMapRef?.current) {
      const map = new window.google.maps.Map(resultMapRef.current, {
        center: location,
        zoom: 6,
        disableDefaultUI: true,
        clickableIcons: false,
        zoomControl: true,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.SMALL,
          position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        mapId: '5777201cf7eeb6a1509c96f1',
      });
  
      const greenPin = new window.google.maps.marker.PinElement({
        background: '#4caf50',
        glyphColor: 'white',
        borderColor: '#415a77',
      });

      new google.maps.marker.AdvancedMarkerElement({
        position: location,
        map,
        content: greenPin.element,
      });
    }
  }, 0);  

  onResult({ correct, actualIsFromUser });
}

export function renderControls({ handleYesNo }) {
  return (
    <div className={commonStyles.controlsContainer}>
      <button onClick={() => handleYesNo(true)} className={styles.yesButton}>Yes, I was here</button>
      <button onClick={() => handleYesNo(false)} className={styles.noButton}>Never been here!</button>
    </div>
  );
}

export function renderResult({ correct, actualIsFromUser }, summaryText) {
  return (
    <p className={commonStyles.resultText}>
      {correct
        ? "✅ Yes, you're right!"
        : "❌ You are wrong."}{" "}
      This {actualIsFromUser ? "was" : "wasn't"} your location.
      <br />
      <>{summaryText}</>
    </p>
  );
}
