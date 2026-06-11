import { useEffect, useRef } from 'react';
import { verifyStreetView } from '../utils/streetView';

const BUFFER_TARGET = 50; // Try to keep at least 50 verified locations
const DELAY_BETWEEN_CHECKS_MS = 200; // 5 checks per second
const SLEEP_WHEN_DONE_MS = 5000; // Check every 5s if we need more buffer

export function useStreetViewVerifier() {
  const isRunning = useRef(false);

  useEffect(() => {
    if (isRunning.current) return;
    isRunning.current = true;

    let timeoutId;

    const runVerification = async () => {
      try {
        const storedSession = localStorage.getItem('session');
        if (!storedSession) {
          timeoutId = setTimeout(runVerification, SLEEP_WHEN_DONE_MS);
          return;
        }

        const session = JSON.parse(storedSession);
        if (!session.coordinates || !session.coordinates.length) {
          timeoutId = setTimeout(runVerification, SLEEP_WHEN_DONE_MS);
          return;
        }

        // Count how many are currently verified
        const verifiedCount = session.coordinates.filter(c => c.svVerified === true).length;

        // Find a pending one (or undefined for older sessions)
        const pendingIndex = session.coordinates.findIndex(c => c.svVerified === 'pending' || c.svVerified === undefined);

        if (pendingIndex === -1 || verifiedCount >= BUFFER_TARGET) {
          // Nothing to do or buffer is full
          // console.log(`[StreetView Background Verifier] Buffer full or no pending points. Sleeping...`);
          timeoutId = setTimeout(runVerification, SLEEP_WHEN_DONE_MS);
          return;
        }

        // Verify the pending point
        const point = session.coordinates[pendingIndex];
        console.log(`[StreetView Background Verifier] Checking point index ${pendingIndex}...`);
        let result = await verifyStreetView(point.lat, point.lng);
        let hasSV = result.hasSV;

        if (!hasSV && point.fallbacks && point.fallbacks.length > 0) {
          for (let i = 0; i < point.fallbacks.length; i++) {
            console.log(`[StreetView Background Verifier] Point ${pendingIndex} failed, trying fallback ${i + 1}/${point.fallbacks.length}...`);
            const fb = point.fallbacks[i];
            const fbResult = await verifyStreetView(fb.lat, fb.lng);
            if (fbResult.hasSV) {
              hasSV = true;
              result = fbResult;
              break;
            }
          }
        }

        console.log(`[StreetView Background Verifier] Result for index ${pendingIndex}: ${hasSV ? 'Verified (Outdoor SV exists)' : 'Failed (No SV coverage)'}. Buffer size: ${verifiedCount + (hasSV ? 1 : 0)}/${BUFFER_TARGET}`);

        // Reload session just in case it was modified by the user playing
        const currentStoredSession = localStorage.getItem('session');
        if (currentStoredSession) {
          const currentSession = JSON.parse(currentStoredSession);
          // Only update if the session hasn't been completely replaced (e.g., re-upload)
          if (currentSession.minDate === session.minDate && currentSession.coordinates?.length === session.coordinates?.length) {
            currentSession.coordinates[pendingIndex].svVerified = hasSV;
            if (hasSV) {
              currentSession.coordinates[pendingIndex].lat = result.lat;
              currentSession.coordinates[pendingIndex].lng = result.lng;
            }
            localStorage.setItem('session', JSON.stringify(currentSession));
          }
        }

        // Continue quickly to build buffer
        timeoutId = setTimeout(runVerification, DELAY_BETWEEN_CHECKS_MS);
      } catch (err) {
        console.error("StreetView Background Verifier Error:", err);
        timeoutId = setTimeout(runVerification, SLEEP_WHEN_DONE_MS);
      }
    };

    runVerification();

    return () => {
      isRunning.current = false;
      clearTimeout(timeoutId);
    };
  }, []);
}
