'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  Database,
  Eye,
  FileText,
  UserCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cookie,
  Baby,
  RefreshCw,
  Mail,
} from 'lucide-react';
import styles from '../info.module.css';

export default function PrivacyPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const sections = [
    { id: 'info-collected', label: '1. Information We Collect' },
    { id: 'how-we-use', label: '2. How We Use Information' },
    { id: 'how-we-share', label: '3. How We Share Information' },
    { id: 'data-security', label: '4. Data Security' },
    { id: 'data-retention', label: '5. Data Retention' },
    { id: 'user-rights', label: '6. User Choices & Rights' },
    { id: 'storage-cookies', label: '7. Cookies & Local Storage' },
    { id: 'children-privacy', label: '8. Children\'s Privacy' },
    { id: 'policy-changes', label: '9. Changes to Policy' },
    { id: 'contact-privacy', label: '10. Privacy Questions' },
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
              <Lock size={14} />
              <span>Privacy & Data Protection</span>
            </div>
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={styles.subtitle}>
              This Privacy Policy explains how Raahi collects, uses, and safeguards your personal data when you use our carpooling platform and related services.
            </p>
            <div className={styles.metaInfo}>
              <span className={styles.metaItem}>
                <Clock size={15} /> Last Updated: November 2026
              </span>
              <span className={styles.metaItem}>
                <ShieldCheck size={15} /> Version 1.0 (Raahi Ride Platform)
              </span>
            </div>
          </div>

          {/* Quick Jump Navigation */}
          <div className={styles.toc}>
            <span className={styles.tocLabel}>Jump to section</span>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className={styles.tocLink}>
                {s.label}
              </a>
            ))}
          </div>

          {/* 1. Information We Collect */}
          <section className={styles.card} id="info-collected">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <Database size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
                <p className={styles.sectionDesc}>
                  Raahi collects only the specific information required to facilitate peer-to-peer carpool discovery, ride coordination, and platform safety.
                </p>
              </div>
            </div>

            <h3 className={styles.legalSubheading}>Account Information</h3>
            <p className={styles.legalParagraph}>
              When you register or log in to Raahi, we collect basic identifying information such as your <strong>full name</strong>, <strong>email address</strong>, and <strong>mobile phone number</strong>. This allows us to establish your user account and verify your communication channel.
            </p>

            <h3 className={styles.legalSubheading}>Profile and Verification Information</h3>
            <p className={styles.legalParagraph}>
              To foster community confidence:
            </p>
            <ul className={styles.featureList} style={{ marginBottom: '16px' }}>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Profile Metrics:</strong> We track community trust metrics including your trip completion count, average user star ratings, and computed environmental impact (such as CO₂ emissions saved and travel expense savings).</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Driver Verification Documents:</strong> Users who apply for verified driver status optionally submit official verification records, specifically an <strong>identity proof (such as Aadhaar card)</strong> and a valid <strong>Driving License</strong>. These documents are securely reviewed by administrators to ensure passenger safety.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Vehicle Details:</strong> When offering rides, drivers provide their vehicle make/model, license plate number, and available seat capacity.</span>
              </li>
            </ul>

            <h3 className={styles.legalSubheading}>Ride and Booking Information</h3>
            <p className={styles.legalParagraph}>
              When you post, search, or book rides, we record:
            </p>
            <ul className={styles.featureList} style={{ marginBottom: '16px' }}>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>Origin, destination, route waypoints, departure date, and departure time.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>Seats requested or offered, price contribution per seat, and optional ride coordination messages.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>Ride request statuses (Pending, Accepted, Rejected, Cancelled, Completed) and booking confirmations.</span>
              </li>
            </ul>

            <h3 className={styles.legalSubheading}>Location Information</h3>
            <p className={styles.legalParagraph}>
              To match users travelling on similar paths, Raahi processes the pickup and destination addresses you type in, along with their geographical coordinates (latitude and longitude) processed via map routing services. Raahi does not engage in background continuous location tracking when the application is closed.
            </p>
          </section>

          {/* 2. How We Use Information */}
          <section className={styles.card} id="how-we-use">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                <Eye size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>2. How We Use Information</h2>
                <p className={styles.sectionDesc}>
                  We process user information strictly to deliver and maintain carpooling features:
                </p>
              </div>
            </div>

            <ul className={styles.featureList}>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Ride Matching:</strong> Analyzing origin, destination, and timing to show relevant ride listings and allow drivers to receive ride requests.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Communication & Notifications:</strong> Delivering in-app notifications regarding request approvals, cancellations, or trip updates.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Safety & Verification:</strong> Reviewing driver credentials and document submissions to maintain verified driver status.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Impact Calculation:</strong> Estimating cumulative CO₂ reduction and estimated fuel cost sharing for user profile badges.</span>
              </li>
            </ul>
          </section>

          {/* 3. How We Share Information */}
          <section className={styles.card} id="how-we-share">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <FileText size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>3. How We Share Information</h2>
                <p className={styles.sectionDesc}>
                  We do not sell, rent, or trade your personal data to advertisers or commercial third parties.
                </p>
              </div>
            </div>

            <p className={styles.legalParagraph}>
              Information sharing is limited to the following operational contexts:
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Between Matched Drivers and Passengers:</strong> Once a ride request is submitted or accepted, the driver and passenger can view each other’s display name, profile rating, contact phone number, vehicle details, and pickup/drop points to coordinate the ride.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Administrative Verification Review:</strong> Submitted verification documents (Aadhaar, Driving License) are strictly restricted to authorized platform administrators for identity validation.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Legal Compliance:</strong> We may disclose information if required to comply with applicable law, law enforcement requests, or to protect the vital safety of community members in emergency scenarios.</span>
              </li>
            </ul>
          </section>

          {/* 4. Data Security */}
          <section className={styles.card} id="data-security">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAmber}`}>
                <Lock size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>4. Data Security</h2>
              </div>
            </div>

            <p className={styles.legalParagraph}>
              We apply technical and procedural safeguards designed to protect your personal information against unauthorized access, loss, or alteration. All communication with our servers is encrypted using standard Transport Layer Security (TLS/HTTPS). Database access is protected by token-based authentication and row-level access controls.
            </p>
            <p className={styles.legalParagraph} style={{ marginBottom: 0 }}>
              However, no electronic data transmission over the internet or storage system can be guaranteed to be 100% impenetrable. We encourage users to maintain confidentiality over their devices and report any suspicious activity immediately.
            </p>
          </section>

          {/* 5. Data Retention */}
          <section className={styles.card} id="data-retention">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <Clock size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>5. Data Retention</h2>
              </div>
            </div>

            <p className={styles.legalParagraph}>
              We retain personal information for as long as your account is active or as necessary to provide ride-matching services, maintain trip history for your profile, resolve disputes, and maintain compliance with verification records. When data is no longer necessary for these operational purposes, it is deleted or anonymized.
            </p>
          </section>

          {/* 6. User Choices and Rights */}
          <section className={styles.card} id="user-rights">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                <UserCheck size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>6. User Choices and Rights</h2>
              </div>
            </div>

            <p className={styles.legalParagraph}>
              You have direct control over your personal data:
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Access & Correction:</strong> You can view and edit your profile details, contact information, and active ride offers directly in the application.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Ride Management:</strong> You can cancel pending ride requests or delete scheduled rides at any time before departure.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Account Sign-Out & Data Requests:</strong> You can sign out from your active session on your Profile page. To request account deactivation or data removal, reach out via the support channel.</span>
              </li>
            </ul>
          </section>

          {/* 7. Cookies and Local Storage */}
          <section className={styles.card} id="storage-cookies">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <Cookie size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>7. Cookies and Similar Storage Technologies</h2>
              </div>
            </div>

            <p className={styles.legalParagraph}>
              Raahi uses browser <strong>local storage</strong> and <strong>session storage</strong> strictly for functional purposes:
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Session Persistence:</strong> Storing active user authentication tokens (e.g. <code>raahi_user</code>) so you stay signed in across page reloads.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span><strong>Theme Preferences:</strong> Saving your light mode or dark mode choice (<code>theme</code>) for a seamless visual experience.</span>
              </li>
            </ul>
            <p className={styles.legalParagraph} style={{ marginTop: '16px', marginBottom: 0 }}>
              Raahi does not deploy advertising tracking cookies, third-party marketing pixels, or behavioral ad profiling scripts.
            </p>
          </section>

          {/* 8. Children's Privacy */}
          <section className={styles.card} id="children-privacy">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAmber}`}>
                <Baby size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>8. Children's Privacy</h2>
              </div>
            </div>

            <p className={styles.legalParagraph} style={{ marginBottom: 0 }}>
              Raahi is intended solely for individuals who are at least 18 years of age and legally competent to enter into agreements. We do not knowingly collect personal information from individuals under the age of 18. If we become aware that an account has been created by a minor, we will promptly terminate the account and delete associated data.
            </p>
          </section>

          {/* 9. Changes to This Privacy Policy */}
          <section className={styles.card} id="policy-changes">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <RefreshCw size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>9. Changes to This Privacy Policy</h2>
              </div>
            </div>

            <p className={styles.legalParagraph} style={{ marginBottom: 0 }}>
              We may update this Privacy Policy from time to time to reflect operational, legal, or technical changes in our service. When changes occur, the updated policy will be posted on this page with a revised "Last Updated" date. Continued use of Raahi following any update signifies your acknowledgement of the revised policy.
            </p>
          </section>

          {/* 10. Contact / Privacy Questions */}
          <section className={styles.contactCard} id="contact-privacy">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                <Mail size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>10. Contact / Privacy Questions</h2>
                <p className={styles.sectionDesc}>
                  If you have questions about this Privacy Policy or your personal information on Raahi:
                </p>
              </div>
            </div>

            <p className={styles.calloutText}>
              Please contact the Raahi Data & Support Desk at:
            </p>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              privacy@raahi-carpool.example
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              (Placeholder contact method for privacy inquiries)
            </span>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
