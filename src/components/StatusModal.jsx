import { useEffect, useId } from 'react';
import modalStyles from './Modal.module.css';

export default function StatusModal({ message, onClose }) {
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!message) return null;

  const { type, title, body } = message;
  const bodyParagraphs = Array.isArray(body)
    ? body.filter(Boolean)
    : body
      ? [body]
      : [];

  const labelledBy = title ? titleId : undefined;
  const describedBy = bodyParagraphs.length ? bodyId : undefined;

  return (
    <div
      className={modalStyles.modalOverlay}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className={`${modalStyles.modalContent} ${modalStyles.modalContentWide}`}
        role={type === 'error' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      >
        {title ? (
          <h2>{title}</h2>
        ) : null}
        <div>
          {bodyParagraphs.map((paragraph, index) => (
            <p key={`status-modal-paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>
        <button
          onClick={onClose}
          className={`${modalStyles.modalButton} ${modalStyles.cancelButton}`}
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  );
}
