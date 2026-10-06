'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Leaf, Users } from 'lucide-react';
import styles from './CarpoolCarousel.module.css';

const SLIDES = [
  {
    id: 1,
    image: '/images/carpool-slide-1.jpg',
    tag: 'Easy Pickup',
    icon: Users,
    title: 'Hop In & Share the Ride',
    description: 'Connect with friendly drivers heading your way in seconds.',
  },
  {
    id: 2,
    image: '/images/carpool-slide-2.jpg',
    tag: 'Trusted & Safe',
    icon: ShieldCheck,
    title: 'Travel with Verified Peers',
    description: 'Government ID & license verified drivers and passengers.',
  },
  {
    id: 3,
    image: '/images/carpool-slide-3.jpg',
    tag: 'Eco-Friendly',
    icon: Leaf,
    title: 'Cut Emissions Together',
    description: 'Every shared seat takes a car off the road for a cleaner city.',
  },
];

export default function CarpoolCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const autoPlayRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (isPaused) return;

    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, nextSlide]);

  // Touch swipe handlers
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 40; // minimum swipe distance

    if (diff > threshold) {
      // Swiped left -> next
      nextSlide();
    } else if (diff < -threshold) {
      // Swiped right -> prev
      prevSlide();
    }
    setIsPaused(false);
  };

  return (
    <div
      className={styles.carouselContainer}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Carpool highlights"
    >
      {/* Slides Track */}
      <div
        className={styles.slidesTrack}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {SLIDES.map((slide, idx) => {
          const Icon = slide.icon;
          return (
            <div key={slide.id} className={styles.slide}>
              <img
                src={slide.image}
                alt={slide.title}
                className={styles.slideImage}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              <div className={styles.overlay}>
                <span className={styles.badge}>
                  <Icon size={12} /> {slide.tag}
                </span>
                <h3 className={styles.slideTitle}>{slide.title}</h3>
                <p className={styles.slideDesc}>{slide.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav Buttons (Desktop) */}
      <button
        type="button"
        className={`${styles.navBtn} ${styles.prevBtn}`}
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        className={`${styles.navBtn} ${styles.nextBtn}`}
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Indicators */}
      <div className={styles.indicators}>
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
