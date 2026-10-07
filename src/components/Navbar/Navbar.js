'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppContext, useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Leaf,
  Bell,
  User,
  Car,
  Search,
  Plus,
  Home,
  Sun,
  Moon,
  Shield,
} from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const appContext = useContext(AppContext);
  const unreadCount = appContext?.unreadCount || 0;
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`} id="main-nav">
        <div className={`container ${styles.inner}`}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <img src="/images/raahi-logo.jpg" alt="Raahi Logo" className={styles.logoImg} />
            <span className={styles.logoText}>
              Raa<span className={styles.logoAccent}>hi</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className={styles.links}>
            <Link href="/search" className={styles.link}>
              <Search size={16} /> Find Rides
            </Link>
            <Link href="/offer" className={styles.link}>
              <Plus size={16} /> Offer Ride
            </Link>
            <Link href="/my-rides" className={styles.link}>
              <Car size={16} /> My Rides
            </Link>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {/* Theme toggle */}
            <button
              className={`${styles.iconBtn} ${styles.themeToggle}`}
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              id="theme-toggle"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link href="/notifications" className={`${styles.iconBtn} ${styles.desktopOnly}`} id="nav-notifications">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount}</span>
              )}
            </Link>
            <Link href="/profile" className={`${styles.iconBtn} ${styles.desktopOnly}`} id="nav-profile">
              <User size={20} />
            </Link>
            <Link href="/offer" className={`btn btn-primary btn-sm ${styles.ctaBtn}`}>
              <Plus size={16} /> Offer a Ride
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className={styles.bottomTabBar}>
        <Link href="/" className={`${styles.tab} ${pathname === '/' ? styles.activeTab : ''}`}>
          <Home size={20} />
          <span className={styles.tabLabel}>Home</span>
        </Link>
        <Link href="/search" className={`${styles.tab} ${pathname === '/search' ? styles.activeTab : ''}`}>
          <Search size={20} />
          <span className={styles.tabLabel}>Search</span>
        </Link>
        <div className={styles.fabWrapper}>
          <Link href="/offer" className={styles.fabBtn}>
            <Plus size={24} />
          </Link>
          <span className={styles.tabLabel}>Offer</span>
        </div>
        <Link href="/my-rides" className={`${styles.tab} ${pathname === '/my-rides' ? styles.activeTab : ''}`}>
          <Car size={20} />
          <span className={styles.tabLabel}>My Rides</span>
        </Link>
        <Link href="/profile" className={`${styles.tab} ${pathname === '/profile' ? styles.activeTab : ''}`}>
          <User size={20} />
          <span className={styles.tabLabel}>Profile</span>
        </Link>
      </div>
    </>
  );
}
