'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MapPin,
  Navigation,
  Calendar,
  Search,
  ArrowRight,
  Leaf,
  Users,
  TrendingDown,
  Zap,
} from 'lucide-react';
import styles from './Hero.module.css';

export default function Hero() {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (date) params.set('date', date);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className={styles.hero} id="hero">
      {/* Background effects */}
      <div className={styles.bgEffects}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
        <div className={styles.grid} />
      </div>

      <div className={`container ${styles.content}`}>
        {/* Badge */}
        <div className={styles.topBadge}>
          <Leaf size={14} />
          <span>Reduce Pollution, Share the Journey</span>
        </div>

        {/* Heading */}
        <h1 className={`heading-xl ${styles.heading}`}>
          <span className={styles.singleLineHeading}>
            Share Rides, <span className="gradient-text">Build Connections</span>
          </span>
        </h1>

        <p className={`text-lg ${styles.subtitle}`}>
          Going somewhere? Someone else is too. Raahi matches you with people
          heading the same way — split costs, cut emissions, and ride together.
        </p>

        {/* Search Card */}
        <form className={styles.searchCard} onSubmit={handleSearch} id="hero-search">
          <div className={styles.searchRow}>
            <div className={styles.inputWrap}>
              <MapPin size={20} className={styles.inputIcon} />
              <input
                type="text"
                placeholder="Pickup location"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={styles.searchInput}
                id="hero-from"
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.inputWrap}>
              <Navigation size={20} className={styles.inputIcon} />
              <input
                type="text"
                placeholder="Drop-off location"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={styles.searchInput}
                id="hero-to"
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.inputWrap}>
              <Calendar size={20} className={styles.inputIcon} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.searchInput}
                id="hero-date"
              />
            </div>
            <button type="submit" className={`btn btn-primary ${styles.searchBtn}`} id="hero-search-btn">
              <Search size={20} />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statIcon}>
              <Users size={20} />
            </div>
            <div>
              <span className={styles.statValue}>12,400+</span>
              <span className={styles.statLabel}>Active Riders</span>
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statIcon}>
              <TrendingDown size={20} />
            </div>
            <div>
              <span className={styles.statValue}>84 tons</span>
              <span className={styles.statLabel}>CO₂ Saved</span>
            </div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statIcon}>
              <Zap size={20} />
            </div>
            <div>
              <span className={styles.statValue}>₹18L+</span>
              <span className={styles.statLabel}>Money Saved</span>
            </div>
          </div>
        </div>

        {/* Hero visual */}
        <div className={styles.heroVisual}>
          <img src="/images/raahi-hero.jpg" alt="Raahi - Share Rides. Build Connections." className={styles.heroImage} />
        </div>
      </div>
    </section>
  );
}
