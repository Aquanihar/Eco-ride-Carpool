'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  MapPin,
  Car,
  Users,
  Eye,
  PhoneCall,
  Lock,
  Flag,
} from 'lucide-react';
import styles from '../info.module.css';

export default function SafetyPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const beforeRideTips = [
    {
      title: "Check the user's profile and available verification information",
      desc: 'Review driver and co-passenger profile details, completed trip counts, community ratings, and verified badges (such as verified Aadhaar and Driving License).',
    },
    {
      title: 'Confirm the pickup location and destination',
      desc: 'Verify exact meeting landmarks and timing well in advance to prevent confusion or last-minute delays.',
    },
    {
      title: 'Communicate through the platform where possible',
      desc: 'Keep coordination messages on Raahi to maintain clear trip records and avoid misunderstandings.',
    },
    {
      title: 'Avoid sharing unnecessary personal information',
      desc: 'Never share sensitive private data like financial details, passwords, personal addresses, or government identification numbers.',
    },
  ];

  const duringRideTips = [
    {
      title: 'Meet at a safe and public pickup location where practical',
      desc: 'Select well-lit, populated meeting spots such as metro stations, transit hubs, prominent fuel stations, or commercial plazas.',
    },
    {
      title: 'Share your trip details with someone you trust',
      desc: 'Inform a family member or friend about your travel schedule, driver name, vehicle registration number, and estimated arrival time.',
    },
    {
      title: 'Follow applicable traffic and safety laws',
      desc: 'Both drivers and passengers must uphold local transport regulations, speed limits, and highway traffic norms.',
    },
    {
      title: 'Never travel with someone if you feel unsafe or uncomfortable',
      desc: 'Trust your instincts. If something feels off, or either vehicle condition or driver behavior seems unsafe, decline or cancel the trip immediately.',
    },
  ];

  const driverGuidelines = [
    'Drive responsibly at all times, maintaining safe following distances and speeds.',
    'Follow all traffic laws, directional signs, signal lights, and lane discipline.',
    'Never drive under the influence of alcohol, medications causing drowsiness, or illicit substances.',
    'Ensure the vehicle is safe, roadworthy, properly maintained, and possesses valid insurance.',
    'Do not exceed the legal passenger capacity of your vehicle under any circumstances.',
  ];

  const passengerGuidelines = [
    "Follow the driver's reasonable safety instructions throughout the trip.",
    'Wear a seatbelt at all times where available and required by traffic law.',
    'Respect the driver and fellow co-passengers; maintain cleanliness and refrain from distracting the driver.',
    'Be punctual at the agreed pickup point to respect everyone’s schedule.',
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
              <ShieldCheck size={14} />
              <span>Trust & Safety</span>
            </div>
            <h1 className={styles.title}>Safety Guidelines & Best Practices</h1>
            <p className={styles.subtitle}>
              Raahi is committed to fostering a secure, respectful, and reliable carpooling community. Review our guidelines for safe and comfortable rides.
            </p>
          </div>

          {/* Quick Notice Banner */}
          <div className={`${styles.callout} ${styles.calloutInfo}`} style={{ marginTop: 0, marginBottom: '32px' }}>
            <div className={styles.calloutIcon}>
              <ShieldCheck size={22} />
            </div>
            <div className={styles.calloutContent}>
              <h3 className={styles.calloutTitle}>Mutual Respect & Accountability</h3>
              <p className={styles.calloutText}>
                Carpooling relies on cooperative trust. By communicating clearly, verifying profile credentials, and respecting fellow commuters, we keep shared mobility safe for everyone.
              </p>
            </div>
          </div>

          {/* Before a Ride */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <UserCheck size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>Before a Ride</h2>
                <p className={styles.sectionDesc}>
                  Smart preparation is the foundation of a hassle-free carpool. Follow these essential steps before meeting your co-travelers:
                </p>
              </div>
            </div>

            <div className={styles.grid2}>
              {beforeRideTips.map((tip, idx) => (
                <div key={idx} className={styles.gridItem}>
                  <div className={styles.gridItemTitle}>
                    <CheckCircle2 size={18} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                    <span>{tip.title}</span>
                  </div>
                  <p className={styles.gridItemText}>{tip.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* During a Ride */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                <MapPin size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>During a Ride</h2>
                <p className={styles.sectionDesc}>
                  Stay alert and prioritize your comfort and safety from pickup to drop-off:
                </p>
              </div>
            </div>

            <div className={styles.grid2}>
              {duringRideTips.map((tip, idx) => (
                <div key={idx} className={styles.gridItem}>
                  <div className={styles.gridItemTitle}>
                    <CheckCircle2 size={18} style={{ color: 'var(--accent-500)', flexShrink: 0 }} />
                    <span>{tip.title}</span>
                  </div>
                  <p className={styles.gridItemText}>{tip.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Drivers & Passengers Responsibilities */}
          <div className={styles.grid2} style={{ marginTop: 0, marginBottom: '32px' }}>
            {/* For Drivers */}
            <section className={styles.card} style={{ marginBottom: 0 }}>
              <div className={styles.sectionHeader}>
                <div className={styles.iconWrapper}>
                  <Car size={22} />
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>For Drivers</h2>
                  <p className={styles.sectionDesc}>Responsibilities for vehicle owners and hosts:</p>
                </div>
              </div>
              <ul className={styles.featureList}>
                {driverGuidelines.map((item, idx) => (
                  <li key={idx} className={styles.featureListItem}>
                    <CheckCircle2 size={18} className={styles.checkIcon} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* For Passengers */}
            <section className={styles.card} style={{ marginBottom: 0 }}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                  <Users size={22} />
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>For Passengers</h2>
                  <p className={styles.sectionDesc}>Guidelines for riders sharing someone's vehicle:</p>
                </div>
              </div>
              <ul className={styles.featureList}>
                {passengerGuidelines.map((item, idx) => (
                  <li key={idx} className={styles.featureListItem}>
                    <CheckCircle2 size={18} className={styles.checkIcon} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Report a Safety Concern */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAmber}`}>
                <Flag size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>Report a Safety Concern</h2>
                <p className={styles.sectionDesc}>
                  We have zero tolerance for misconduct, discrimination, harassment, or unsafe driving.
                </p>
              </div>
            </div>

            <p className={styles.legalParagraph}>
              Users should promptly report suspicious, unsafe, abusive, or inappropriate behaviour through the application's available support and reporting mechanism. When reporting an incident, please provide:
            </p>

            <ul className={styles.featureList} style={{ marginBottom: '20px' }}>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>The date, time, and route of the shared trip.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>The name and profile details of the person involved.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>A clear summary of what occurred so our moderation team can take appropriate action, including account suspension or blacklisting.</span>
              </li>
            </ul>

            <div className={`${styles.callout} ${styles.calloutWarning}`}>
              <div className={styles.calloutIcon}>
                <AlertTriangle size={22} />
              </div>
              <div className={styles.calloutContent}>
                <h3 className={styles.calloutTitle}>Emergency Situations</h3>
                <p className={styles.calloutText}>
                  If you ever feel in immediate danger or witness a critical traffic incident, do not wait for support ticket responses. Immediately dial emergency services (<strong>112 / Police</strong>) or head to the nearest secure public establishment.
                </p>
              </div>
            </div>
          </section>

          {/* Safety Disclaimer */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAmber}`}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>Community Safety Disclaimer</h2>
              </div>
            </div>

            <p className={styles.legalParagraph}>
              Raahi operates strictly as a peer-to-peer technology platform that connects drivers and passengers travelling in the same direction. While Raahi promotes safe ride sharing and offers driver document verification, Raahi is not a transportation carrier, taxi provider, or employer, and does not operate vehicles or supervise driving conditions.
            </p>
            <p className={styles.legalParagraph} style={{ marginBottom: 0 }}>
              Users must exercise their own judgment, common sense, and personal caution when sharing rides, and must follow all applicable motor vehicle and traffic laws at all times.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
