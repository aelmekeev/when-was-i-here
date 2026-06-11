import { forwardRef, useEffect, useRef, useState } from 'react';
import { parseTimeline } from '../utils/parse';
import { filterPoints } from '../utils/filter';
import { getTimelineSummary } from '../utils/summary';
import common from '../pages/styles/Common.module.css';
import styles from './TimelineUploadFlow.module.css';

const MINIMUM_POINTS = 20;

const TimelineUploadFlow = forwardRef(function TimelineUploadFlow({
  inputId = 'timeline-upload',
  buttonLabel = 'Upload Timeline',
  processingLabel = 'Processing…',
  buttonClassName = '',
  disabled = false,
  minimumPoints = MINIMUM_POINTS,
  prepareSession = async (session) => session,
  summaryTitle = 'Your Timeline Summary',
  summaryDescription = 'We are filtering out frequently visited places and locations too close to each other to keep the game fun — and your privacy safe.',
  confirmLabel = 'Continue',
  confirmLoadingLabel = 'Uploading…',
  confirmButtonClassName = `${common.button} ${common.buttonHighlight}`,
  onConfirm,
  onError,
}, ref) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const summaryRef = useRef(null);

  useEffect(() => {
    if (summary && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [summary]);

  const reset = () => {
    setSummary(null);
    setSessionData(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      alert("Failed to process the file. Make sure it's a valid JSON exported from Google Timeline.");
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const raw = loadEvent.target?.result;
        const data = JSON.parse(raw);
        const timelineData = parseTimeline(data);
        const filteredSession = filterPoints(timelineData);

        if (filteredSession.coordinates.length < minimumPoints) {
          alert("Not enough points to play the game. Please upload a file with more data.");
          reset();
          return;
        }

        const preparedSession = await prepareSession(filteredSession);
        const { countriesEstimate, pointsEstimate } = getTimelineSummary(filteredSession);

        setSummary({
          countries: countriesEstimate,
          total: filteredSession.coordinates.length,
          filtered: pointsEstimate,
          period: `${filteredSession.minDate.toLocaleDateString("en", { year: 'numeric', month: 'long' })} to ${filteredSession.maxDate.toLocaleDateString("en", { year: 'numeric', month: 'long' })}`,
        });

        setSessionData({
          filteredSession,
          preparedSession,
        });
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert("Failed to process the file. Make sure it's a valid JSON exported from Google Timeline.");
        reset();
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
      alert("Failed to process the file. Make sure it's a valid JSON exported from Google Timeline.");
      setIsProcessing(false);
      reset();
    };

    reader.readAsText(file);
  };

  const handleConfirm = async () => {
    if (!sessionData?.filteredSession?.coordinates?.length) {
      alert("No session data to confirm.");
      return;
    }

    if (typeof onConfirm !== 'function') {
      reset();
      return;
    }

    try {
      setIsConfirming(true);
      const shouldReset = await onConfirm({
        summary,
        filteredSession: sessionData.filteredSession,
        preparedSession: sessionData.preparedSession,
      });

      if (shouldReset !== false) {
        reset();
      }
    } catch (error) {
      console.error(error);
      if (typeof onError === 'function') {
        onError(error);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <div className={styles.uploadWrapper}>
        <label
          htmlFor={inputId}
          className={buttonClassName}
          aria-disabled={disabled || isProcessing}
          ref={ref}
        >
          {isProcessing ? processingLabel : buttonLabel}
        </label>
        <input
          id={inputId}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className={styles.visuallyHidden}
          disabled={disabled || isProcessing}
        />
      </div>

      {summary ? (
        <div className={styles.summaryWrapper}>
          <section className={common.section} ref={summaryRef}>
            <h2>{summaryTitle}</h2>
            <ul className={common.list}>
              <li><strong>Countries identified:</strong> {summary.countries}</li>
              <li><strong>Total locations found:</strong> {summary.total}</li>
              <li><strong>Possible game locations:</strong> {summary.filtered}</li>
              <li><strong>Period covered:</strong> {summary.period}</li>
            </ul>
            <p>{summaryDescription}</p>
            <button
              type="button"
              onClick={handleConfirm}
              className={confirmButtonClassName}
              disabled={isConfirming}
            >
              {isConfirming ? confirmLoadingLabel : confirmLabel}
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
});

export default TimelineUploadFlow;