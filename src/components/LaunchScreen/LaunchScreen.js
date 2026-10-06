'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './LaunchScreen.module.css';

export default function LaunchScreen({ onFinish, duration = 2200 }) {
  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);

  const handleComplete = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setExiting(true);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 420);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div
      className={`${styles.launchContainer} ${exiting ? styles.exiting : ''}`}
      onClick={handleComplete}
      role="banner"
      aria-label="Raahi Splash Screen"
    >
      <div className={styles.ambientGlow} />

      <div className={styles.logoWrapper}>
        <img
          src="/images/raahi-logo.jpg"
          alt="Raahi"
          className={styles.logoImage}
          priority="true"
        />
      </div>

      <div className={styles.footerArea}>
        <div className={styles.loaderDots}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      </div>
    </div>
  );
}
