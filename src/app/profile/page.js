'use client';

import { AppProvider, useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  User,
  Mail,
  Phone,
  Star,
  MapPin,
  Leaf,
  Wallet,
  TrendingDown,
  Award,
  Shield,
  Edit3,
  Settings,
  LogOut,
  Car,
  TreePine,
} from 'lucide-react';
import styles from './profile.module.css';

function ProfileContent() {
  const { user, bookings } = useApp();

  const impactCards = [
    {
      icon: TrendingDown,
      label: 'CO₂ Saved',
      value: `${user.co2Saved} kg`,
      color: 'var(--primary-400)',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      icon: Wallet,
      label: 'Money Saved',
      value: `₹${user.moneySaved.toLocaleString()}`,
      color: 'var(--warm-400)',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      icon: Car,
      label: 'Total Trips',
      value: user.trips,
      color: 'var(--accent-400)',
      bg: 'rgba(6, 182, 212, 0.1)',
    },
    {
      icon: TreePine,
      label: 'Trees Equivalent',
      value: Math.round(user.co2Saved / 21),
      color: 'var(--primary-400)',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
  ];

  const badges = [
    { name: 'Early Adopter', icon: '🚀', earned: true },
    { name: 'Eco Warrior', icon: '🌿', earned: true },
    { name: '10 Rides', icon: '🎯', earned: true },
    { name: '50 Rides', icon: '⭐', earned: false },
    { name: 'Zero Carbon Week', icon: '🌍', earned: false },
    { name: 'Top Rated', icon: '👑', earned: false },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          {/* Profile header */}
          <div className={styles.profileHeader}>
            <div className={styles.avatarLarge}>
              {user.name.charAt(0)}
            </div>
            <div className={styles.profileInfo}>
              <h1 className="heading-lg">{user.name}</h1>
              <div className={styles.profileMeta}>
                <span className={styles.metaItem}>
                  <Mail size={14} /> {user.email}
                </span>
                <span className={styles.metaItem}>
                  <Phone size={14} /> {user.phone}
                </span>
                <span className={styles.metaItem}>
                  <Star size={14} className={styles.starIcon} /> {user.rating} rating
                </span>
              </div>
              <div className={styles.profileActions}>
                <button className="btn btn-secondary btn-sm">
                  <Edit3 size={14} /> Edit Profile
                </button>
                <button className="btn btn-secondary btn-sm">
                  <Settings size={14} /> Settings
                </button>
              </div>
            </div>
          </div>

          {/* Eco Impact */}
          <section className={styles.section}>
            <h2 className="heading-md">
              <Leaf size={20} className={styles.sectionIconGreen} />
              Your Eco Impact
            </h2>
            <div className={styles.impactGrid}>
              {impactCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className={styles.impactCard}>
                    <div
                      className={styles.impactIcon}
                      style={{ color: card.color, background: card.bg }}
                    >
                      <Icon size={22} />
                    </div>
                    <div className={styles.impactValue}>{card.value}</div>
                    <div className={styles.impactLabel}>{card.label}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Badges */}
          <section className={styles.section}>
            <h2 className="heading-md">
              <Award size={20} className={styles.sectionIconAmber} />
              Badges & Achievements
            </h2>
            <div className={styles.badgesGrid}>
              {badges.map((badge, i) => (
                <div
                  key={i}
                  className={`${styles.badgeCard} ${!badge.earned ? styles.locked : ''}`}
                >
                  <span className={styles.badgeEmoji}>{badge.icon}</span>
                  <span className={styles.badgeName}>{badge.name}</span>
                  {!badge.earned && <span className={styles.badgeLock}>🔒</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className={styles.section}>
            <h2 className="heading-md">Quick Actions</h2>
            <div className={styles.quickActions}>
              <a href="/search" className={styles.actionCard}>
                <MapPin size={20} />
                <span>Find a Ride</span>
              </a>
              <a href="/offer" className={styles.actionCard}>
                <Car size={20} />
                <span>Offer a Ride</span>
              </a>
              <a href="/my-rides" className={styles.actionCard}>
                <Star size={20} />
                <span>My Rides</span>
              </a>
              <button className={`${styles.actionCard} ${styles.logoutAction}`}>
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ProfilePage() {
  return (
    <AppProvider>
      <ProfileContent />
    </AppProvider>
  );
}
