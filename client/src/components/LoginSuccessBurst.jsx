import React, { useEffect } from "react";

import styles from "./LoginSuccessBurst.module.css";

/** Timings must match `burstCardOut` delay + duration in CSS (0.98s + 0.24s). */
const BURST_TOTAL_MS = 1230;

export default function LoginSuccessBurst({ onComplete }) {
  useEffect(() => {
    const id = window.setTimeout(() => {
      onComplete();
    }, BURST_TOTAL_MS);
    return () => window.clearTimeout(id);
  }, [onComplete]);

  return (
    <div className={styles.layer} role="presentation" aria-hidden="true">
      <div className={styles.dim} />
      <div className={styles.card}>
        <span className={styles.emoji} aria-label="Success">
          🛡️
        </span>
        <p className={styles.title}>{"You're in!"}</p>
        <p className={styles.tagline}>{"Stay sharp — PhishGuard's got your back"}</p>
        <div className={styles.sparkleRow}>
          <span className={styles.sparkle}>✦</span>
          <span className={styles.sparkle}>✦</span>
          <span className={styles.sparkle}>✦</span>
        </div>
      </div>
    </div>
  );
}
