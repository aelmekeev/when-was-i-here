import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import modalStyles from '../components/Modal.module.css';
import commonStyles from './styles/Common.module.css';
import styles from './Game.module.css';
import * as whereMode from '../modes/where.jsx';
import * as wasIHereMode from '../modes/whether.jsx';
import * as whenMode from '../modes/when.jsx';
import { getCountryFromCoords } from '../utils/summary';
import { computeDistanceKm } from '../utils/distance';
import Confetti from '../components/Confetti';

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const modeHandlers = {
  where: whereMode,
  whether: wasIHereMode,
  when: whenMode
};

export default function Game() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(null);
  const [modeHandler, setModeHandler] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [locations, setLocations] = useState([]);
  const [usedIndexes, setUsedIndexes] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [actualIsFromUser, setActualIsFromUser] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [guessedYear, setGuessedYear] = useState('');
  const [guessedMonth, setGuessedMonth] = useState('');
  const [selectedDateGuess, setSelectedDateGuess] = useState(null);
  const [guessOptions, setGuessOptions] = useState([]);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultState, setResultState] = useState({});
  const [roundHistory, setRoundHistory] = useState([]);
  const [roundNumber, setRoundNumber] = useState(0);
  const [makeHarder, setMakeHarder] = useState(false);
  const [makeEasier, setMakeEasier] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const shouldCelebrateResult = useCallback(() => {
    if (!mode || !resultState) return false;

    if (mode === 'where') {
      const distance = resultState?.distanceKm;
      return typeof distance === 'number' && distance <= whereMode.CLOSE_DISTANCE_THRESHOLD_KM;
    }

    if (mode === 'whether') {
      return Boolean(resultState?.correct);
    }

    if (mode === 'when') {
      const monthDiff = resultState?.monthDiff;
      return typeof monthDiff === 'number' && monthDiff == 0;
    }

    return false;
  }, [mode, resultState]);

  useEffect(() => {
    if (!showResultModal) {
      setIsCelebrating(false);
      return;
    }

    if (!shouldCelebrateResult()) return;

    setIsCelebrating(true);
    const timeout = setTimeout(() => setIsCelebrating(false), 3500);

    return () => clearTimeout(timeout);
  }, [showResultModal, shouldCelebrateResult]);

  const getSummaryTitle = (roundNum, maxRounds) => {
    if (roundNum < maxRounds) return `Your Score (round ${roundNum}/${maxRounds})`;
    return 'Your Final Score';
  };

  const getSummaryText = (isFinal) => {
    const results = roundHistory.filter((r) => r.mode === mode);
    if (results.length < 2) return null;

    if (mode === 'whether') {
      const correct = results.filter((r) => r.correct).length;
      const percent = Math.round((correct / results.length) * 100);
      return isFinal ? `Your final score: ${percent}%.` : `So far you've been ${percent}% correct.`;
    }

    if (mode === 'where') {

      const avg =
        results.reduce((sum, r) => sum + (r.distanceKm || 0), 0) /
        results.length;
      return isFinal ? `Your final average distance: ${whereMode.formatDistance(avg)}.` : `Average distance so far: ${whereMode.formatDistance(avg)}.`;
    }

    if (mode === 'when') {
      const avg =
        results.reduce((sum, r) => sum + (r.monthDiff || 0), 0) /
        results.length;
      return isFinal ? `Average months off: ${avg.toFixed(0)}.` : `Average months off so far: ${avg.toFixed(0)}.`;
    }

    return null;
  };

  const getExtraLinks = (location, resultState) => {
    const { actualIsFromUser } = resultState;

    const { month, year } = location;
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    const country = getCountryFromCoords(location.lat, location.lng);

    const searchString = `${monthName} ${year} ${country.name === "unknown" ? "" : country.name}`;
    return (
      <p className={styles.extraLink}>
        View this location on <a href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`} target="_blank" rel="noopener noreferrer">Google Street View</a>.<br />
        {actualIsFromUser && (
          <>Revisit your Google Photos from this location <a href={`https://photos.google.com/search/${searchString}`} target="_blank" rel="noopener noreferrer">here</a>.</>
        )}
      </p>
    );
  };

  const streetViewRef = useRef(null);
  const guessMapRef = useRef(null);
  const resultMapRef = useRef(null);
  const [guessMap, setGuessMap] = useState(null);
  const roundNumberRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode') || 'where';
    const isDemo = params.get('demo') === 'true';
    setDemoMode(isDemo);
    setMode(modeParam);
  }, [location.search]);

  useEffect(() => {
    if (mode) {
      setModeHandler(modeHandlers[mode]);
    }
  }, [mode]);

  useEffect(() => {
    if (!modeHandler) return;

    const loadData = async () => {
      await loadGoogleMaps();

      if (demoMode) {
        try {
          const module = await import('../utils/demoSession.js');
          const coordinates = module.demoSession.coordinates.filter(c => c.sv) || [];
          if (!coordinates.length) {
            alert('No demo coordinates found.');
            navigate('/');
            return;
          }
          roundNumberRef.current = 0;
          setRoundNumber(0);
          setUsedIndexes([]);
          setRoundHistory([]);
          setLocations(coordinates);
          startNewRound(coordinates, []);
        } catch (err) {
          console.error("Failed to load demo session", err);
          alert('Failed to load demo session.');
          navigate('/');
        }
        return;
      }

      const storedSession = localStorage.getItem('session');
      if (!storedSession) {
        alert('No session data found.');
        navigate('/');
        return;
      }

      let coordinates = [];
      try {
        coordinates = JSON.parse(storedSession)?.coordinates || [];
      } catch (e) {
        console.error("Failed to parse session", e);
        navigate('/');
        return;
      }

      const params = new URLSearchParams(location.search);
      const ignoreNearbyParam = params.get('ignoreNearby') === 'true';
      const latParam = parseFloat(params.get('lat'));
      const lngParam = parseFloat(params.get('lng'));

      if (ignoreNearbyParam && !isNaN(latParam) && !isNaN(lngParam) && !demoMode) {
        coordinates = coordinates.filter(c => {
          const dist = computeDistanceKm(c.lat, c.lng, latParam, lngParam);
          return dist >= 50;
        });
      }

      if (!coordinates.length) {
        if (ignoreNearbyParam) {
          alert('No locations found outside your current area (~50km). Try playing without the filter.');
        } else {
          alert('No coordinates found in session.');
        }
        navigate('/');
        return;
      }

      roundNumberRef.current = 0;
      setRoundNumber(0);
      setUsedIndexes([]);
      setRoundHistory([]);
      setLocations(coordinates);
      startNewRound(coordinates, []);
    };

    loadData();
  }, [modeHandler, navigate, demoMode]);

  const loadGoogleMaps = () => {
    return new Promise((resolve) => {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        if (document.querySelector('script[data-google-maps]')) {
          const waitForReady = () => {
            if (window.google && window.google.maps) resolve();
            else setTimeout(waitForReady, 50);
          };
          waitForReady();
        } else {
          const script = document.createElement('script');
          script.setAttribute('data-google-maps', 'true');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=marker`;
          script.async = true;
          script.defer = true;
          script.onload = resolve;
          document.body.appendChild(script);
        }
      }
    });
  };

  const startNewRound = async (allLocations, previousIndexes) => {
    const maxRounds = demoMode ? 3 : 10;
    if (previousIndexes.length >= allLocations.length || roundNumberRef.current >= maxRounds) {
      return;
    }

    roundNumberRef.current += 1;
    setRoundNumber(roundNumberRef.current);

    if (mode === 'whether') {
      let valid = false;
      let selection;

      while (!valid) {
        // Prevent infinite loop if all locations are checked and invalid
        if (previousIndexes.length >= allLocations.length) {
          alert("We ran out of valid locations with Street View coverage!");
          navigate('/');
          return;
        }

        selection = modeHandler.selectNextLocation({
          userLocations: allLocations,
          usedIndexes: previousIndexes,
          currentRound: roundNumberRef.current,
          totalRounds: maxRounds,
        });

        if (demoMode || !selection.isFromUser) {
          valid = true;
        } else {
          const loc = selection.location;
          if (loc.svVerified === true) {
            valid = true;
          } else if (loc.svVerified === false) {
            previousIndexes.push(selection.index);
          } else {
            console.log(`[Game JIT Verifier] Buffer empty! Checking point ${selection.index} on the fly...`);
            let result = await import('../utils/streetView.js').then(m => m.verifyStreetView(loc.lat, loc.lng));
            let hasSV = result.hasSV;

            if (!hasSV && loc.fallbacks && loc.fallbacks.length > 0) {
              for (let i = 0; i < loc.fallbacks.length; i++) {
                console.log(`[Game JIT Verifier] Point ${selection.index} failed, trying fallback ${i + 1}/${loc.fallbacks.length}...`);
                const fb = loc.fallbacks[i];
                const fbResult = await import('../utils/streetView.js').then(m => m.verifyStreetView(fb.lat, fb.lng));
                if (fbResult.hasSV) {
                  hasSV = true;
                  result = fbResult;
                  break;
                }
              }
            }

            console.log(`[Game JIT Verifier] Point ${selection.index} result: ${hasSV ? 'Valid' : 'Invalid'}.`);
            loc.svVerified = hasSV;
            if (hasSV) {
              loc.lat = result.lat;
              loc.lng = result.lng;
            }
            const sess = JSON.parse(localStorage.getItem('session') || '{}');
            if (sess.coordinates) {
              sess.coordinates[selection.index].svVerified = hasSV;
              if (hasSV) {
                sess.coordinates[selection.index].lat = result.lat;
                sess.coordinates[selection.index].lng = result.lng;
              }
              localStorage.setItem('session', JSON.stringify(sess));
            }
            if (hasSV) {
              valid = true;
            } else {
              previousIndexes.push(selection.index);
            }
          }
        }
      }

      const { location, isFromUser, index } = selection;
      if (index !== null) setUsedIndexes([...previousIndexes, index]);
      setCurrentLocation(location);
      setActualIsFromUser(isFromUser);
      setCurrentIndex(index);

      modeHandler.initRound({ location, streetViewRef, setGuessMap });
      setShowResultModal(false);
      setResultState({});
      return;
    }

    let valid = false;
    let loc, index;

    while (!valid) {
      if (previousIndexes.length >= allLocations.length) {
        alert("We ran out of valid locations with Street View coverage!");
        navigate('/');
        return;
      }

      do {
        index = Math.floor(Math.random() * allLocations.length);
      } while (previousIndexes.includes(index));

      loc = allLocations[index];

      if (demoMode) {
        valid = true;
      } else if (loc.svVerified === true) {
        valid = true;
      } else if (loc.svVerified === false) {
        previousIndexes.push(index);
      } else {
        console.log(`[Game JIT Verifier] Buffer empty! Checking point ${index} on the fly...`);
        let result = await import('../utils/streetView.js').then(m => m.verifyStreetView(loc.lat, loc.lng));
        let hasSV = result.hasSV;

        if (!hasSV && loc.fallbacks && loc.fallbacks.length > 0) {
          for (let i = 0; i < loc.fallbacks.length; i++) {
            console.log(`[Game JIT Verifier] Point ${index} failed, trying fallback ${i + 1}/${loc.fallbacks.length}...`);
            const fb = loc.fallbacks[i];
            const fbResult = await import('../utils/streetView.js').then(m => m.verifyStreetView(fb.lat, fb.lng));
            if (fbResult.hasSV) {
              hasSV = true;
              result = fbResult;
              break;
            }
          }
        }

        console.log(`[Game JIT Verifier] Point ${index} result: ${hasSV ? 'Valid' : 'Invalid'}.`);
        loc.svVerified = hasSV;
        if (hasSV) {
          loc.lat = result.lat;
          loc.lng = result.lng;
        }
        const sess = JSON.parse(localStorage.getItem('session') || '{}');
        if (sess.coordinates) {
          sess.coordinates[index].svVerified = hasSV;
          if (hasSV) {
            sess.coordinates[index].lat = result.lat;
            sess.coordinates[index].lng = result.lng;
          }
          localStorage.setItem('session', JSON.stringify(sess));
        }
        if (hasSV) {
          valid = true;
        } else {
          previousIndexes.push(index);
        }
      }
    }

    setUsedIndexes([...previousIndexes, index]);
    setCurrentLocation(loc);

    const defaultControl = localStorage.getItem('whenControl') || 'multiple';
    setIsMultipleChoice(defaultControl === 'multiple');

    modeHandler?.initRound({
      location: loc,
      streetViewRef,
      guessMapRef,
      setGuessMap,
      setGuessOptions,
    });

    setShowResultModal(false);
    setResultState({});
    setGuessedYear('');
    setGuessedMonth('');
    setSelectedDateGuess(null);
  };

  const handleSubmitGuess = () => {
    if (!modeHandler || !currentLocation) return;

    if (mode === 'when') {
      if (isMultipleChoice) {
        if (!selectedDateGuess) return;
        modeHandler.submitGuess({
          currentLocation,
          selectedDateGuess,
          onResult: (result) => {
            setResultState(result);
            setRoundHistory((h) => [...h, { mode, ...result }]);
            setShowResultModal(true);
          },
          resultMapRef,
        });
      } else {
        if (!guessedYear || !guessedMonth) {
          alert("Please select both year and month before submitting.");
          return;
        }
        modeHandler.submitGuess({
          currentLocation,
          guessMap,
          guessedYear: parseInt(guessedYear),
          guessedMonth: parseInt(guessedMonth),
          onResult: (result) => {
            setResultState(result);
            setRoundHistory((h) => [...h, { mode, ...result }]);
            setShowResultModal(true);
          },
          resultMapRef,
        });
      }
    } else {
      modeHandler.submitGuess({
        currentLocation,
        guessMap,
        onResult: (result) => {
          setResultState(result);
          setRoundHistory((h) => [...h, { mode, ...result }]);
          setShowResultModal(true);
        },
        resultMapRef,
      });
    }
  };

  const handleNextRound = () => {
    if (!modeHandler) return;

    const maxRounds = demoMode ? 3 : 10;
    if (roundNumberRef.current >= maxRounds) {
      handleFinishGame();
      return;
    }

    if (mode === 'when') {
      if (makeHarder) {
        localStorage.setItem('whenControl', 'manual');
      }
      if (makeEasier) {
        localStorage.setItem('whenControl', 'multiple');
      }
    }
    setMakeHarder(false);
    setMakeEasier(false);
    startNewRound(locations, usedIndexes);
  };

  const handleFinishGame = () => {
    navigate('/');
  };

  const handleYesNo = (userSaidYes) => {
    if (!modeHandler || !currentLocation) return;

    modeHandler.submitGuess({
      userSaidYes,
      actualIsFromUser,
      location: currentLocation,
      onResult: (result) => {
        setResultState(result);
        setRoundHistory((h) => [...h, { mode, ...result }]);
        setShowResultModal(true);
      },
      resultMapRef,
    });
  };

  if (!modeHandler) return <p>Loading...</p>;

  const maxRounds = demoMode ? 3 : 10;

  return (
    <div className={styles.mapContainer}>
      <Confetti active={isCelebrating} />
      <div ref={streetViewRef} className={styles.streetView}></div>
      {modeHandler.renderControls?.({
        mode,
        handleSubmitGuess,
        handleYesNo,
        guessMapRef,
        streetViewRef,
        guessedYear,
        guessedMonth,
        setGuessedYear,
        setGuessedMonth,
        selectedDateGuess,
        setSelectedDateGuess,
        guessOptions,
        isMultipleChoice,
      })}
      {showResultModal && (
        <div className={modalStyles.modalOverlay}>
          <div className={`${modalStyles.modalContent} ${styles.scoreModal}`}>
            <p className={styles.scoreTitle}>{getSummaryTitle(roundNumber, maxRounds)}</p>
            <div ref={resultMapRef} className={styles.resultMap}></div>
            {demoMode ? <div className={styles.demoDisclaimer}>Demo round - these locations and results are just examples.</div> : null}
            {modeHandler.renderResult(resultState, getSummaryText(roundNumber == maxRounds), demoMode)}
            {mode === 'when' && (
              <>
                <label>
                  <input
                    type="checkbox"
                    checked={isMultipleChoice ? makeHarder : makeEasier}
                    onChange={(e) => {
                      if (isMultipleChoice) setMakeHarder(e.target.checked);
                      else setMakeEasier(e.target.checked);
                    }}
                  />{' '}
                  {isMultipleChoice ? "It was too easy, make it harder!" : "It was too hard, make it easier!"}
                </label>
                <br /><br />
              </>
            )}
            {getExtraLinks(currentLocation, resultState)}
            <div className={styles.actions}>
              {(roundNumber < maxRounds) && (
                <button onClick={handleNextRound} className={commonStyles.button}>Next Round</button>
              )}
              {demoMode && (roundNumber >= maxRounds) ? (
                <button onClick={handleFinishGame} className={`${commonStyles.button} ${commonStyles.buttonHighlight}`}>Upload Your Timeline</button>
              ) : null}
              {!demoMode && (roundNumber >= maxRounds) ? (
                <button onClick={handleFinishGame} className={commonStyles.button}>Finish Game</button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
