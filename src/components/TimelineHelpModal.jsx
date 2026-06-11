import { useEffect, useState } from 'react';
import commonStyles from '../pages/styles/Common.module.css';
import modalStyles from './Modal.module.css';

const PLATFORM_INSTRUCTIONS = {
  ios: {
    steps: [
      'Open the Google Maps app.',
      'Tap your profile picture.',
      'Tap "Your Timeline".',
      'Tap on the three dot menu.',
      'Tap "Location & privacy settings".',
      'Tap "Export Timeline data".',
    ],
  },
  android: {
    steps: [
      'Open the Google Maps app.',
      'Tap your profile picture.',
      'Tap "Settings."',
      'Tap "Google location settings".',
      'Tap "Location Services".',
      'Tap "Timeline".',
      'Tap “Export Timeline data”.',
    ],
  },
};

const RADIO_OPTIONS = [
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
];

const detectPlatform = () => {
  if (typeof window === 'undefined') return 'ios';

  const nav = window.navigator || {};
  const userAgent = nav.userAgent || nav.vendor || '';

  if (/android/i.test(userAgent)) return 'android';
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';

  if (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1) {
    return 'ios';
  }

  return 'ios';
};

export default function TimelineHelpModal({ onClose }) {
  const [selectedPlatform, setSelectedPlatform] = useState('ios');

  useEffect(() => {
    setSelectedPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const activeInstructions =
    PLATFORM_INSTRUCTIONS[selectedPlatform] ?? PLATFORM_INSTRUCTIONS.ios;

  return (
    <div className={modalStyles.modalOverlay}>
      <div className={`${modalStyles.modalContent} ${modalStyles.modalContentWide}`}>
        <h2>How to Export Timeline File</h2>
        <fieldset className={modalStyles.radioGroup}>
          <legend className={modalStyles.radioGroupLegend}>Show instructions for</legend>
          <div className={modalStyles.radioOptions}>
            {RADIO_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className={`${modalStyles.radioLabel} ${
                  selectedPlatform === value ? modalStyles.radioLabelActive : ''
                }`}
              >
                <input
                  type="radio"
                  name="timeline-platform"
                  value={value}
                  checked={selectedPlatform === value}
                  onChange={() => setSelectedPlatform(value)}
                  className={modalStyles.radioInput}
                />
                <span className={modalStyles.radioText}>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <ol className={commonStyles.numberedList}>
          {activeInstructions.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className={commonStyles.disclaimerText}>
          If your Timeline is turned off, you won’t be able to use the service.
        </p>
        <button onClick={onClose} className={`${modalStyles.modalButton} ${modalStyles.cancelButton}`}>
          Close
        </button>
      </div>
    </div>
  );
}
