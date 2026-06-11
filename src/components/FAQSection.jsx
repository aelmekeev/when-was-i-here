import styles from './FAQSection.module.css';

export default function FAQSection({ heading = 'Got Questions?', extendedVersion = false }) {
  return (
    <section className={styles.faqSection}>
      <h2>{heading}</h2>

      <details className={styles.faqItem} id="what-is-a-timeline">
        <summary><strong>What is Timeline?</strong></summary>
        <p>
          Your Timeline is a file you can download from your Google Maps app. It contains the places you’ve visited over the years.
          When you upload it to When Was I Here, we turn that data into a game based on your travels.
        </p>
      </details>

      <details className={styles.faqItem} id="export-timeline">
        <summary><strong>How do I export my Timeline file?</strong></summary>
        <ol className={styles.faqSteps}>
          <li>Open Google Maps app on your phone.</li>
          <li>Tap your profile picture or initial in the top right corner.</li>
          <ul>
            <li>
              For iOS: Tap <strong>Your Timeline</strong> → <strong>Three dots menu (...)</strong>{' '}
              → <strong>“Location & privacy settings”</strong> → <strong>“Export Timeline data”</strong>.
            </li>
            <li>
              For Android: Tap <strong>“Settings”</strong> → <strong>“Google location settings”</strong>{' '}
              → <strong>“Location Services”</strong> → <strong>“Timeline”</strong> →{' '}
              <strong>“Export Timeline data”</strong>.
            </li>
          </ul>
        </ol>
        <p>If your Timeline is turned off or you don’t have any location history saved, you won’t be able to use the service — there won’t be any data for us to create your game from. You can turn on your Timeline and start collecting your travel history — we’ll be happy to see you here later.</p>
      </details>

      <details className={styles.faqItem} id="how-do-i-play">
        <summary><strong>How do I play?</strong></summary>
        <p>
          Once you upload your Timeline file, the game drops you into a random location from your past using Google Street View.
          You then guess where or when you were there by placing a marker on the map or choosing the correct answer.
        </p>

        <p>
          There are several ways to play:
        </p>

        <p>
          <strong>Was I Here?</strong><br />
          Decide if you’ve been here before — choose “Yes, I was here” or “Never been here!”
        </p>

        <p>
          <strong>Where Am I?</strong><br />
          Place the marker on the map where you think this location is.
        </p>

        <p>
          <strong>When Was I Here?</strong><br />
          Choose the time you last visited this place based on your uploaded Timeline data.
        </p>
      </details>

      {extendedVersion ? (
        <details className={styles.faqItem} id="best-device">
          <summary><strong>What device is best to play on?</strong></summary>
          <p>
            You can play on any device, but a computer or laptop offers the best experience because of the larger map view.
          </p>
        </details>
      ) : null}

      {extendedVersion ? (
        <details className={styles.faqItem} id="do-i-need-to-install-anything">
          <summary><strong>Do I need to install anything?</strong></summary>
          <p>
            No — When Was I Here runs entirely in your browser.
          </p>
        </details>
      ) : null}

      {extendedVersion ? (
        <details className={styles.faqItem} id="can-i-play-on-phone">
          <summary><strong>Can I play on my phone?</strong></summary>
          <p>
            Yes. You can upload your Timeline file directly from your phone and play right away.
          </p>
        </details>
      ) : null}

      <details className={styles.faqItem} id="is-my-data-shared-with-anyone">
        <summary><strong>Is my data shared with anyone?</strong></summary>
        <p>
          No. We never sell or share your data. Your information is used only to personalise your game.
        </p>
      </details>
    </section>
  );
}
