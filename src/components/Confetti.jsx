import { useMemo } from 'react';
import styles from './Confetti.module.css';

const COLORS = ['#f97316', '#facc15', '#34d399', '#38bdf8', '#a855f7', '#f472b6'];
const PIECES = 60;

export default function Confetti({ active }) {
  const pieces = useMemo(() => (
    Array.from({ length: PIECES }, (_, index) => ({
      id: index,
      color: COLORS[index % COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 1.4 + Math.random() * 1.8,
      startRotate: Math.random() * 360,
      midRotate: Math.random() * 540,
      endRotate: 360 + Math.random() * 720,
      sway: (Math.random() * 40) - 20,
      scale: 0.6 + Math.random() * 0.7,
    }))
  ), []);

  if (!active) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={styles.piece}
          style={{
            '--confetti-left': `${piece.left}%`,
            '--confetti-delay': `${piece.delay}s`,
            '--confetti-duration': `${piece.duration}s`,
            '--confetti-start-rotate': `${piece.startRotate}deg`,
            '--confetti-mid-rotate': `${piece.startRotate + piece.midRotate}deg`,
            '--confetti-end-rotate': `${piece.startRotate + piece.midRotate + piece.endRotate}deg`,
            '--confetti-sway': `${piece.sway}vw`,
            '--confetti-scale': piece.scale,
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  );
}
