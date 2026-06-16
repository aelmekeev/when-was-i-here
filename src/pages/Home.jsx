import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Home.module.css';
import common from './styles/Common.module.css';
import TimelineUploadFlow from '../components/TimelineUploadFlow';
import TimelineHelpModal from '../components/TimelineHelpModal';
import FAQSection from '../components/FAQSection';

export default function Home() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const uploadBtnRef = useRef(null);

  useEffect(() => {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      try {
        setSession(JSON.parse(storedSession));
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }
  }, []);

  const handleTimelineConfirm = async ({ filteredSession }) => {
    if (!filteredSession || !filteredSession.coordinates?.length) {
      alert("No valid session data found.");
      return false;
    }
    
    // We only need the coordinates that have Street View (if we do filtering later) or just keep all.
    // The parse/filter steps in TimelineUploadFlow already do the heavy lifting.
    // Actually, MainContent previously expected SV filtering here, but TimelineUploadFlow's filterPoints 
    // doesn't filter SV. Let's just save the filteredSession and Game.jsx will handle SV checks or we just assume all are game locations.
    // Wait, the original code in MainContent didn't do SV filtering for the demo.
    // Let's just save the session.
    
    localStorage.setItem('session', JSON.stringify(filteredSession));
    setSession(filteredSession);
    
    // Scroll to top when game is ready
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  };

  const handleDeleteData = () => {
    if (window.confirm("Are you sure you want to delete all your game data from this browser?")) {
      localStorage.removeItem('session');
      setSession(null);
    }
  };

  const handleGeoguessrTakeout = () => {
    if (!session) return;
    try {
      const text = JSON.stringify(session, null, 2);
      const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wwih-geoguessr.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('We could not start the download.');
    }
  };
  
  const handleDataTakeout = () => {
    handleGeoguessrTakeout(); // In client-only mode, it's the same data.
  };

  const renderStep = (mode, title, description, iconSrc) => (
    <Link
      to={`/game?mode=${mode}`}
      className={styles.stepLink}
    >
      <div className={`${common.step} ${common.interactiveStep}`}>
        <h3>{title}</h3>
        <img className={common.stepIcon} src={iconSrc} alt={title} />
        <p>{description}</p>
      </div>
    </Link>
  );

  if (!session) {
    return (
      <div className={common.container}>
        <section className={common.hero}>
          <h1>Play a game from your own travel history</h1>
          <p>Upload your Google Timeline and see if you can guess WHERE or WHEN you've been! All data is processed and stored locally on your device.</p>
        </section>

        <section className={common.stepsContainer}>
          <h2>How It Works</h2>
          <div>
            <div className={`${common.step} ${common.stepTransparent}`}>
              <h3>Step 1: Export</h3>
              <svg className={common.stepIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>
              <p>Download your Timeline file from the Google Maps app on your phone.</p>
            </div>

            <div className={`${common.step} ${common.stepTransparent}`}>
              <h3>Step 2: Upload</h3>
              <svg className={common.stepIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>
              <p>Your browser processes your file locally and keeps just the locations needed for the game.</p>
            </div>

            <div className={`${common.step} ${common.stepTransparent}`}>
              <h3>Step 3: Play</h3>
              <svg className={common.stepIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q146 0 255.5 91.5T872-559h-82q-19-73-68.5-130.5T600-776v16q0 33-23.5 56.5T520-680h-80v80q0 17-11.5 28.5T400-560h-80v80h80v120h-40L168-552q-3 18-5.5 36t-2.5 36q0 131 92 225t228 95v80Zm364-20L716-228q-21 12-45 20t-51 8q-75 0-127.5-52.5T440-380q0-75 52.5-127.5T620-560q75 0 127.5 52.5T800-380q0 27-8 51t-20 45l128 128-56 56ZM620-280q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Z"/></svg>
              <p>Test your memory of places you've visited, directly in your browser.</p>
            </div>
          </div>
        </section>

        <section className={common.actionSection} id="ready-to-try">
          <h2>Ready to Play?</h2>
          <div className={common.actionContainer}>
            <button
              className={`${common.button}`}
              onClick={() => navigate('/game?demo=true')}
            >
              Try Demo Round
            </button>
            <span style={{margin: "0 10px"}}>or</span>
            <TimelineUploadFlow
              inputId="timeline-upload"
              buttonClassName={`${common.button} ${common.buttonHighlight}`}
              processingLabel="Processing…"
              confirmLabel="Start Playing"
              confirmLoadingLabel="Loading…"
              onConfirm={handleTimelineConfirm}
              ref={uploadBtnRef}
            />
          </div>

          <p className={common.actionLinks}>
            <a href="#" onClick={(e) => { e.preventDefault(); setShowTimelineModal(true); }}>
              How do I export my Timeline file?
            </a>
          </p>

          {showTimelineModal && (
            <TimelineHelpModal onClose={() => setShowTimelineModal(false)} />
          )}
        </section>
        
        <FAQSection extendedVersion={false} />
      </div>
    );
  }

  return (
    <div className={common.container}>
      <section className={common.hero}>
        <h1>Turn Your Past Into a Game</h1>
        <p>Your Timeline data is loaded and ready to play.</p>
      </section>

      <section className={common.stepsContainer}>
        <h2>Choose Your Challenge</h2>
        <div>
          {renderStep(
            'whether',
            'Was I Here?',
            'Can you get higher than 50/50 in recognising if you have been there before?',
            `${import.meta.env.BASE_URL}whether.png`
          )}

          {renderStep(
            'where',
            'Where Am I?',
            "Try to get as close as you can to the location you've previously been.",
            `${import.meta.env.BASE_URL}where.png`
          )}

          {renderStep(
            'when',
            'When Was I Here?',
            'Try to guess when was the last time you were in the location.',
            `${import.meta.env.BASE_URL}when.png`
          )}
        </div>
      </section>

      <section className={common.actionSection}>
        <div className={common.actionContainer}>
          <TimelineUploadFlow
            inputId="session-timeline-update"
            buttonClassName={`${common.button} ${common.buttonHighlight}`}
            buttonLabel="Update Timeline Data"
            processingLabel="Processing…"
            confirmLabel="Update Data"
            confirmLoadingLabel="Updating…"
            onConfirm={handleTimelineConfirm}
          />
        </div>

        <p className={common.actionLinks}>
          <button
            type="button"
            onClick={handleGeoguessrTakeout}
            className={styles.actionButton}
          >
            Download Map for GeoGuessr
          </button>

          <span className={common.actionLinksSeparator}>|</span>

          <button onClick={handleDeleteData} className={styles.actionButton}>
            Delete Data
          </button>
        </p>

        <p className={common.actionLinks} style={{marginTop: "20px"}}>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowTimelineModal(true); }}>
            How do I export my Timeline file?
          </a>
        </p>
        
        {showTimelineModal && (
          <TimelineHelpModal onClose={() => setShowTimelineModal(false)} />
        )}
      </section>
    </div>
  );
}
