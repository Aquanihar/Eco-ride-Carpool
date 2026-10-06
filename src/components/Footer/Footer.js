'use client';

import Link from 'next/link';
import { Leaf, Globe, Send, MessageCircle, Heart } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <div className="container">
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              <img src="/images/raahi-logo.jpg" alt="Raahi Logo" className={styles.logoImg} />
              <span className={styles.logoText}>Raahi</span>
            </div>
            <p className="text-sm">
              Share Rides. Build Connections. Making commutes greener, easier, and more affordable one shared ride at a time.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className={styles.colTitle}>Product</h4>
            <ul className={styles.linkList}>
              <li><Link href="/search">Find Rides</Link></li>
              <li><Link href="/offer">Offer a Ride</Link></li>
              <li><Link href="/my-rides">My Rides</Link></li>
              <li><Link href="/profile">Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>Company</h4>
            <ul className={styles.linkList}>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>Support</h4>
            <ul className={styles.linkList}>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Safety</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © 2026 Raahi. Made with <Heart size={14} className={styles.heart} /> for the planet.
          </p>
          <div className={styles.socials}>
            <a href="#" className={styles.socialIcon}><Globe size={18} /></a>
            <a href="#" className={styles.socialIcon}><Send size={18} /></a>
            <a href="#" className={styles.socialIcon}><MessageCircle size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
