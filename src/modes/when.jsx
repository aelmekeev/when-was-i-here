import styles from './when.module.css';
import commonStyles from './common.module.css';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CLOSE_MONTH_THRESHOLD = 3;

export function initRound({ location, streetViewRef, setGuessOptions }) {
  new window.google.maps.StreetViewPanorama(streetViewRef.current, {
    position: location,
    source: window.google.maps.StreetViewSource.OUTDOOR,
    pov: { heading: 165, pitch: 5 },
    zoom: 0,
    disableDefaultUI: true,
    showRoadLabels: false,
    linksControl: false,
    motionTracking: false,
  });

  if (setGuessOptions) {
    const options = generateGuessOptions(location);
    setGuessOptions(options);
  }
}

function generateGuessOptions(location) {
  const actualDate = new Date(location.year, location.month - 1);
  const now = new Date();
  now.setDate(1); // Normalize to first of the month for comparison

  const actualKey = `${actualDate.getFullYear()}-${actualDate.getMonth() + 1}`;
  const options = new Set([actualKey]);
  const getMonthOffset = () => Math.floor(Math.random() * 5) - 2;

  while (options.size < 4) {
    const monthOffset = getMonthOffset();
    const randomYear = location.year + Math.floor(Math.random() * 5) - 2;
    const month = actualDate.getMonth() + monthOffset;
    const optionDate = new Date(randomYear, month);

    // Skip future dates
    optionDate.setDate(1);
    if (optionDate > now) continue;

    const key = `${optionDate.getFullYear()}-${optionDate.getMonth() + 1}`;
    options.add(key);
  }

  return Array.from(options).map((key) => {
    const [year, month] = key.split("-").map(Number);
    return { year, month };
  });
}


export function submitGuess({ currentLocation, onResult, resultMapRef, guessedYear, guessedMonth, selectedDateGuess }) {
  let guessed;
  if (selectedDateGuess) {
    guessed = selectedDateGuess;
  } else {
    guessed = { year: guessedYear, month: guessedMonth };
  }

  if (!guessed?.year || !guessed?.month) {
    alert("Please select a location and time.");
    return;
  }

  const real = currentLocation;
  const monthDiff = Math.abs((real.year - guessed.year) * 12 + (real.month - guessed.month));

  setTimeout(() => {
    if (resultMapRef?.current) {
      const map = new window.google.maps.Map(resultMapRef.current, {
        center: real,
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
        position: real,
        map,
        content: greenPin.element,
        title: "Actual location",
      });
    }
  }, 0);

  onResult({
    monthDiff,
    actualYear: real.year,
    actualMonth: real.month,
    actualIsFromUser: true
  });
}

export function renderControls({
  guessedYear,
  guessedMonth,
  setGuessedYear,
  setGuessedMonth,
  handleSubmitGuess,
  isMultipleChoice,
  guessOptions,
  selectedDateGuess,
  setSelectedDateGuess,
}) {
  if (isMultipleChoice) {
    return (
      <div className={styles.choiceGrid}>
        {guessOptions.map((opt, idx) => {
          const selected = selectedDateGuess?.year === opt.year && selectedDateGuess?.month === opt.month;
          return (
            <button
              key={idx}
              className={`${styles.choiceButton} ${selected ? styles.choiceSelected : ''}`}
              onClick={() => {
                if (selected) handleSubmitGuess();
                else setSelectedDateGuess(opt);
              }}
            >
              {`${MONTHS[opt.month - 1]} ${opt.year}`}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={commonStyles.controlsContainer}>
      <input
        type="number"
        value={guessedYear}
        onChange={(e) => setGuessedYear(e.target.value)}
        min="2000"
        max={new Date().getFullYear()}
        placeholder="Enter Year"
      />
      <select
        value={guessedMonth}
        onChange={(e) => setGuessedMonth(e.target.value)}
      >
        <option value="">-- Select Month --</option>
        {MONTHS.map((month, idx) => (
          <option key={idx} value={idx + 1}>{month}</option>
        ))}
      </select>
      <button onClick={handleSubmitGuess} className={styles.guessButton}>Submit Guess</button>
    </div>
  );
}

export function renderResult({ monthDiff, actualYear, actualMonth }, summaryText) {
  const formattedDate = actualYear && actualMonth
    ? `${MONTHS[actualMonth - 1]} ${actualYear}`
    : null;

  return (
    <p className={commonStyles.resultText}>
      {monthDiff === 0 && <>Congratulations! You are right!</>}
      {monthDiff > 0 && monthDiff <= CLOSE_MONTH_THRESHOLD && <>Wow, you're really close! </>}
      {monthDiff != 0 && <>You were {monthDiff} month{monthDiff !== 1 ? 's' : ''} off in time.</>}
      {formattedDate && (
        <> According to your timeline, last time you visited this place in <strong>{formattedDate}</strong>.</>
      )}
      <br />
      <>{summaryText}</>
    </p>
  );
}
