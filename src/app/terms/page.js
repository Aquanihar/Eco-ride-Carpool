'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Users,
  Car,
  Ban,
  Clock,
  HelpCircle,
  Mail,
  AlertCircle,
} from 'lucide-react';
import styles from '../info.module.css';

export default function TermsPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const sections = [
    { id: 'acceptance', label: '1. Acceptance of Terms' },
    { id: 'eligibility', label: '2. Eligibility' },
    { id: 'accounts', label: '3. User Accounts' },
    { id: 'ride-listings', label: '4. Ride Listings & Nature of Service' },
    { id: 'driver-responsibilities', label: '5. Driver Responsibilities' },
    { id: 'passenger-responsibilities', label: '6. Passenger Responsibilities' },
    { id: 'requests-acceptance', label: '7. Ride Requests & Acceptance' },
    { id: 'cancellations', label: '8. Cancellations' },
    { id: 'cost-sharing', label: '9. Peer-to-Peer Cost Sharing' },
    { id: 'conduct-prohibited', label: '10. User Conduct & Prohibited Activities' },
    { id: 'ugc', label: '11. User Content & Ratings' },
    { id: 'suspension', label: '12. Account Suspension & Termination' },
    { id: 'disclaimers', label: '13. Disclaimers & Limitation of Liability' },
    { id: 'changes', label: '14. Changes to Terms' },
    { id: 'contact', label: '15. Contact Information' },
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
              <Scale size={14} />
              <span>Legal Agreement</span>
            </div>
            <h1 className={styles.title}>Terms of Service</h1>
            <p className={styles.subtitle}>
              Please read these Terms of Service carefully before accessing or using the Raahi carpooling application and services.
            </p>
            <div className={styles.metaInfo}>
              <span className={styles.metaItem}>
                <Clock size={15} /> Effective Date: November 2026
              </span>
              <span className={styles.metaItem}>
                <FileCheck size={15} /> Version 1.0 (Peer-to-Peer Commute)
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

          {/* 1. Acceptance of Terms */}
          <section className={styles.card} id="acceptance">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <FileCheck size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              By accessing, browsing, or creating an account on the Raahi platform ("Raahi", "we", "our", or "us"), you agree to be legally bound by these Terms of Service. If you do not agree to all terms and conditions set forth herein, you must not use or access the service.
            </p>
          </section>

          {/* 2. Eligibility */}
          <section className={styles.card} id="eligibility">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                <Users size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>2. Eligibility</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              To use Raahi, you must be at least <strong>18 years of age</strong> and have the full legal capacity to enter into binding agreements under applicable law.
            </p>
            <p className={styles.legalParagraph} style={{ marginBottom: 0 }}>
              To offer rides as a driver, you must additionally possess a valid, current government-issued driving license appropriate for the vehicle category, and own or have explicit legal authorization to operate the vehicle used for the carpool journey.
            </p>
          </section>

          {/* 3. User Accounts */}
          <section className={styles.card} id="accounts">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>3. User Accounts</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              When creating an account on Raahi, you agree to provide truthful, accurate, and up-to-date information, including your legal name, contact phone number, and email. You are responsible for maintaining the security of your device and login sessions. You must immediately notify Raahi if you detect any unauthorized access to your account.
            </p>
          </section>

          {/* 4. Ride Listings & Nature of Service */}
          <section className={styles.card} id="ride-listings">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                <Car size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>4. Ride Listings & Platform Role</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              <strong>Peer-to-Peer Intermediary Only:</strong> Raahi provides a digital communications and matching platform that enables private drivers travelling to a specific destination to connect with passengers travelling along a compatible route.
            </p>
            <p className={styles.legalParagraph}>
              Raahi is <strong>not</strong> a transportation carrier, taxi service, public conveyance provider, or employer. Raahi does not own, inspect, maintain, or operate vehicles, nor does Raahi employ or direct drivers. Any ride arrangement formed is an independent, private contract between the participating driver and passenger(s).
            </p>
          </section>

          {/* 5. Driver Responsibilities */}
          <section className={styles.card} id="driver-responsibilities">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <Car size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>5. Driver Responsibilities</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              When listing and carrying out a shared journey, every driver warrants and agrees that:
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>They hold a valid driver's license in good standing.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>The vehicle is fully registered, properly insured under applicable motor vehicle law, roadworthy, and regularly serviced.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>They will follow all traffic regulations, speed limits, and highway safety codes.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>They will never operate a vehicle under the influence of alcohol, drugs, or impairing medication.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>The number of passengers carried will never exceed the legal passenger and seatbelt capacity of the vehicle.</span>
              </li>
            </ul>
          </section>

          {/* 6. Passenger Responsibilities */}
          <section className={styles.card} id="passenger-responsibilities">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                <Users size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>6. Passenger Responsibilities</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              Passengers booking or joining a ride agree that:
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>They will arrive punctually at the agreed pickup location.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>They will wear a seatbelt at all times while the vehicle is in motion.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>They will treat the driver, fellow passengers, and the vehicle with respect and care.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>They will comply with reasonable safety instructions issued by the driver during transit.</span>
              </li>
            </ul>
          </section>

          {/* 7. Ride Requests & Acceptance */}
          <section className={styles.card} id="requests-acceptance">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>7. Ride Requests and Acceptance</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              Submitting a ride request does not guarantee a booking until the driver actively accepts the request through the application. Drivers retain discretionary judgment over whether to accept or decline ride requests on their private vehicles, provided such decisions do not violate applicable non-discrimination principles.
            </p>
          </section>

          {/* 8. Cancellations */}
          <section className={styles.card} id="cancellations">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAmber}`}>
                <Clock size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>8. Cancellations</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              Users should promptly cancel ride bookings or offered rides through the "My Rides" screen if their plans change. Repeated last-minute cancellations or failures to show up without prior communication may result in lower user ratings or account restriction to protect community reliability.
            </p>
          </section>

          {/* 9. Cost Sharing */}
          <section className={styles.card} id="cost-sharing">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <Scale size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>9. Peer-to-Peer Cost Sharing</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              <strong>Non-Commercial Travel Expense Sharing:</strong> Raahi is exclusively designed for bona fide carpooling where private individuals share fuel, toll, and running costs for a journey they were already planning to make.
            </p>
            <p className={styles.legalParagraph}>
              The price per seat set by the driver must strictly reflect a genuine contribution toward trip expenses and must not be used to generate commercial profit or operate an unlicensed public taxi/transport service.
            </p>
            <p className={styles.legalParagraph} style={{ marginBottom: 0 }}>
              <em>Note:</em> The current Raahi platform facilitates route matching and booking records; any financial cost-share settlement between driver and passenger is settled directly between the participants as agreed.
            </p>
          </section>

          {/* 10. User Conduct & Prohibited Activities */}
          <section className={styles.card} id="conduct-prohibited">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAmber}`}>
                <Ban size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>10. User Conduct & Prohibited Activities</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              Users agree not to engage in any of the following prohibited behaviors:
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>Harassment, intimidation, abusive behavior, or discrimination based on race, gender, religion, or nationality.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>Submitting forged, misleading, or fraudulent identification documents or vehicle details.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>Transporting hazardous materials, illegal substances, weapons, or contraband.</span>
              </li>
              <li className={styles.featureListItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>Using the service to solicit, spam, or advertise commercial transportation services outside the carpooling scope.</span>
              </li>
            </ul>
          </section>

          {/* 11. User Content & Ratings */}
          <section className={styles.card} id="ugc">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <Users size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>11. User-Generated Content & Ratings</h2>
              </div>
            </div>
            <p className={styles.legalParagraph} style={{ marginBottom: 0 }}>
              Users may post trip details, messages, and submit reviews/ratings. You grant Raahi a non-exclusive license to display this content on the platform to facilitate ride operations and community trust. Raahi reserves the right to remove any content that violates these Terms.
            </p>
          </section>

          {/* 12. Account Suspension & Termination */}
          <section className={styles.card} id="suspension">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAmber}`}>
                <AlertCircle size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>12. Account Suspension & Termination</h2>
              </div>
            </div>
            <p className={styles.legalParagraph} style={{ marginBottom: 0 }}>
              Raahi reserves the right, at its sole discretion, to suspend or terminate user accounts, decline document verification, or remove ride listings without prior notice if a user breaches these Terms, provides fraudulent credentials, exhibits dangerous conduct, or receives persistent safety complaints.
            </p>
          </section>

          {/* 13. Disclaimers & Limitation of Liability */}
          <section className={styles.card} id="disclaimers">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAmber}`}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>13. Disclaimers & Limitation of Liability</h2>
              </div>
            </div>
            <p className={styles.legalParagraph}>
              <strong>"AS IS" Basis:</strong> The Raahi service, software, and route matching are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied.
            </p>
            <p className={styles.legalParagraph}>
              <strong>No Insurance or Road Guarantees:</strong> Raahi does not provide commercial motor vehicle insurance, roadside assistance, or guarantees regarding the behavior, punctuality, roadworthiness, or driving competence of users. Each user relies on their own personal assessment and auto insurance coverage.
            </p>
            <p className={styles.legalParagraph} style={{ marginBottom: 0 }}>
              To the fullest extent permitted by applicable law, Raahi and its operators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from carpool journeys, vehicle accidents, delays, property damage, personal injury, or disputes between platform users.
            </p>
          </section>

          {/* 14. Changes to Terms */}
          <section className={styles.card} id="changes">
            <div className={styles.sectionHeader}>
              <div className={styles.iconWrapper}>
                <Clock size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>14. Changes to Terms</h2>
              </div>
            </div>
            <p className={styles.legalParagraph} style={{ marginBottom: 0 }}>
              We may revise these Terms from time to time. When revisions are made, we will update the "Effective Date" at the top of this page. Your continued use of the platform after the revised Terms become effective constitutes your acceptance of the changes.
            </p>
          </section>

          {/* 15. Contact Information */}
          <section className={styles.contactCard} id="contact">
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                <Mail size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>15. Contact Information</h2>
                <p className={styles.sectionDesc}>
                  For questions regarding these Terms of Service or regulatory matters:
                </p>
              </div>
            </div>
            <p className={styles.calloutText}>
              Reach the Raahi Legal & Support team at:
            </p>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              legal@raahi-carpool.example
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              (Placeholder contact method for legal & terms inquiries)
            </span>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
