'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  ArrowLeft,
  Compass,
  Target,
  Eye,
  Search,
  PlusCircle,
  Users,
  Send,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Leaf,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import styles from '../info.module.css';

export default function AboutPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const whatWeOffer = [
    {
      icon: Search,
      title: 'Find rides from other users',
      desc: 'Quickly find verified rides that match your route, commute timings, and pickup preferences with real-time route matching.',
    },
    {
      icon: PlusCircle,
      title: 'Offer available seats in your vehicle',
      desc: 'Drivers can easily post vacant seats on their planned trips, offset daily travel expenses, and reduce empty cars on city roads.',
    },
    {
      icon: Users,
      title: 'Connect drivers and passengers',
      desc: 'Fosters direct, transparent communication between co-travelers heading towards compatible destinations.',
    },
    {
      icon: Send,
      title: 'Request rides',
      desc: 'Seamlessly submit seat booking requests with custom pickup/drop details and optional notes for the driver.',
    },
    {
      icon: CheckCircle2,
      title: 'Allow drivers to accept ride requests',
      desc: 'Drivers maintain full control over who joins their ride, reviewing passenger requests before accepting or declining.',
    },
    {
      icon: Calendar,
      title: 'Manage your rides from one place',
      desc: 'Convenient dashboard to keep track of active, upcoming, completed, and recurring rides with live notifications.',
    },
    {
      icon: ShieldCheck,
      title: 'Build a trusted ride-sharing community',
      desc: 'Promotes peace of mind through driver document verification (Aadhaar & Driving License), genuine ratings, and mutual reviews.',
    },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          {/* Back Navigation */}
          <div className={styles.backNav}>
            <button onClick={handleBack} className={styles.backBtn} aria-label="Go back">
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.badge}>
              <Compass size={14} />
              <span>Company Overview</span>
            </div>
            <h1 className={styles.title}>About Raahi</h1>
            <p className={styles.subtitle}>
              Raahi is a carpooling platform designed to make everyday travel more affordable, convenient, connected, and environmentally friendly.
            </p>
          </div>

          {/* Mission & Vision Cards */}
          <div className={styles.grid2} style={{ marginTop: 0, marginBottom: '32px' }}>
            <div className={styles.card} style={{ marginBottom: 0 }}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconWrapper}>
                  <Target size={22} />
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Our Mission</h2>
                  <p className={styles.sectionDesc}>
                    Our mission is to connect people travelling in the same direction so they can share rides, reduce travel costs, make better use of available vehicle seats, and reduce unnecessary traffic and emissions.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.card} style={{ marginBottom: 0 }}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                  <Eye size={22} />
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Our Vision</h2>
                  <p className={styles.sectionDesc}>
                    To create a reliable and connected community where shared mobility becomes a simple and natural part of everyday travel.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What Raahi Offers */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>What Raahi Offers</h2>
                <p className={styles.sectionDesc}>
                  Every feature in Raahi is designed to make smart ride sharing seamless, transparent, and collaborative.
                </p>
              </div>
            </div>

            <div className={styles.grid2}>
              {whatWeOffer.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={index} className={styles.gridItem}>
                    <div className={styles.gridItemTitle}>
                      <span className={styles.numberBadge}>{index + 1}</span>
                      <span>{item.title}</span>
                    </div>
                    <p className={styles.gridItemText}>{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Environmental and Social Impact */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                <Leaf size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>Our Commitment to Greener Commutes</h2>
                <p className={styles.sectionDesc}>
                  Every single seat filled through carpooling directly takes an extra vehicle off congested city streets.
                </p>
              </div>
            </div>

            <div className={styles.grid3}>
              <div className={styles.gridItem}>
                <div className={styles.gridItemTitle}>
                  <TrendingDown size={20} style={{ color: 'var(--primary-500)' }} />
                  <span>Lower Carbon Footprint</span>
                </div>
                <p className={styles.gridItemText}>
                  Shared journeys translate to substantial reductions in urban carbon dioxide emissions and cleaner local air.
                </p>
              </div>

              <div className={styles.gridItem}>
                <div className={styles.gridItemTitle}>
                  <Users size={20} style={{ color: 'var(--accent-500)' }} />
                  <span>Cost Efficiency</span>
                </div>
                <p className={styles.gridItemText}>
                  By splitting fuel and toll contributions, drivers and passengers enjoy significantly lower daily commute costs.
                </p>
              </div>

              <div className={styles.gridItem}>
                <div className={styles.gridItemTitle}>
                  <ShieldCheck size={20} style={{ color: 'var(--primary-500)' }} />
                  <span>Trusted Network</span>
                </div>
                <p className={styles.gridItemText}>
                  With profile verification, document checks, and ratings, riders can travel with clarity and confidence.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.callout} style={{ marginTop: '28px' }}>
              <div className={styles.calloutIcon}>
                <Compass size={20} />
              </div>
              <div className={styles.calloutContent}>
                <h3 className={styles.calloutTitle}>Ready to join Raahi?</h3>
                <p className={styles.calloutText} style={{ marginBottom: '14px' }}>
                  Whether you are driving to work tomorrow morning or looking for a comfortable seat on your commute, get started in seconds.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Link href="/search" className="btn btn-primary btn-sm">
                    Find Rides
                  </Link>
                  <Link href="/offer" className="btn btn-secondary btn-sm">
                    Offer a Ride
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
