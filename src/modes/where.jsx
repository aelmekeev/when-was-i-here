import { useEffect, useRef, useState } from 'react';
import { computeDistanceKm } from '../utils/distance';
import commonPagesStyles from '../pages/styles/Common.module.css';
import commonStyles from './common.module.css';
import styles from './where.module.css';

let guessMarker = null;

export const CLOSE_DISTANCE_THRESHOLD_KM = 10;

export function initRound({ location, streetViewRef, guessMapRef, setGuessMap }) {
  // Street View
  new window.google.maps.StreetViewPanorama(streetViewRef.current, {
    position: location,
    source: window.google.maps.StreetViewSource.OUTDOOR,
    pov: { heading: 165, pitch: 5 },
    zoom: 0,
    disableDefaultUI: true,
    linksControl: false,
    motionTracking: false,
    showRoadLabels: false,
  });

  // Guess Map
  const map = new window.google.maps.Map(guessMapRef.current, {
    center: { lat: 20, lng: 0 },
    zoom: 2,
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.SMALL,
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    clickableIcons: false,
    mapId: '5777201cf7eeb6a1c9ad76af',
  });

  map.addListener('click', (e) => {
    const latLng = e.latLng;
  
    if (guessMarker) guessMarker.setMap(null);
  
    guessMarker = new google.maps.marker.AdvancedMarkerElement({
      position: latLng,
      map,
    });
  
    map.panTo(latLng);
  });

  setGuessMap(map);
}

export function submitGuess({ currentLocation, onResult, resultMapRef }) {
  if (!guessMarker) {
    alert("Please select a location first.");
    return;
  }

  const guessed = guessMarker.position;
  const real = currentLocation;

  const distanceKm = computeDistanceKm(
    guessed.lat,
    guessed.lng,
    real.lat,
    real.lng
  );

  onResult({ distanceKm, actualIsFromUser: true });

  guessMarker = null;

  setTimeout(() => {
    if (resultMapRef?.current) {
      const map = new window.google.maps.Map(resultMapRef.current, {
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        zoomControl: true,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.SMALL,
          position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        mapId: '5777201cf7eeb6a1509c96f1',
      });

      const bounds = new window.google.maps.LatLngBounds();

      const greenPin = new window.google.maps.marker.PinElement({
        background: '#4caf50',
        glyphColor: 'white',
        borderColor: '#415a77',
      });
      const realMarker = new google.maps.marker.AdvancedMarkerElement({
        position: real,
        map,
        content: greenPin.element,
        title: "Actual location",
      });

      const redPin = new window.google.maps.marker.PinElement({
        background: '#e63946',
        glyphColor: 'white',
        borderColor: '#415a77',
      });
      const guessedMarker = new google.maps.marker.AdvancedMarkerElement({
        position: guessed,
        map,
        content: redPin.element,
        title: "Your guess",
      });

      bounds.extend(realMarker.position);
      bounds.extend(guessedMarker.position);

      map.fitBounds(bounds, 50);
    }
  }, 0); // Force defer
}

function WhereControls({ handleSubmitGuess, guessMapRef, streetViewRef }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const guessAreaRef = useRef(null);

  useEffect(() => {
    const handleAnyInput = (event) => {
      const isInsideGuessArea = () => {
        if (!guessAreaRef.current) return false;

        const composedPath = event.composedPath?.();

        if (Array.isArray(composedPath) && composedPath.length > 0) {
          return composedPath.includes(guessAreaRef.current);
        }

        return guessAreaRef.current.contains(event.target);
      };

      if (!isInsideGuessArea()) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('pointerdown', handleAnyInput, true);
    document.addEventListener('touchstart', handleAnyInput, true);

    return () => {
      document.removeEventListener('pointerdown', handleAnyInput, true);
      document.removeEventListener('touchstart', handleAnyInput, true);
    };
  }, []);

  const expandGuessMap = () => setIsExpanded(true);
  const collapseGuessMap = () => setIsExpanded(false);

  return (
    <div
      ref={guessAreaRef}
      className={styles.guessHoverWrapper}
      onPointerDown={expandGuessMap}
      onTouchStart={expandGuessMap}
      onMouseEnter={expandGuessMap}
      onMouseLeave={collapseGuessMap}
    >
      <div className={styles.hoverArea}></div>
      <div className={`${styles.guessContainer} ${isExpanded ? styles.guessContainerExpanded : ''}`}>
        <div ref={guessMapRef} className={styles.guessMap}></div>
        <button onClick={handleSubmitGuess} className={`${commonPagesStyles.button} ${commonPagesStyles.buttonHighlight} ${styles.guessButton}`}>Submit Guess</button>
      </div>
    </div>
  );
}

export function renderControls({ handleSubmitGuess, guessMapRef, streetViewRef }) {
  return (
    <WhereControls
      handleSubmitGuess={handleSubmitGuess}
      guessMapRef={guessMapRef}
      streetViewRef={streetViewRef}
    />
  );
}

export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return (distanceKm * 1000).toFixed(0) + "m";
  } else {
    return distanceKm.toFixed(2) + "km";
  }
}

export function renderResult({ distanceKm }, summaryText) {
  return <p className={commonStyles.resultText}>
    {distanceKm <= CLOSE_DISTANCE_THRESHOLD_KM && (
      <>Wow, you're really close! </>
    )}
    You were {formatDistance(distanceKm)} away.
    <br />
    <>{summaryText}</>
  </p>;
}
