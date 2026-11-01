'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  ArrowLeft,
  HelpCircle,
  BookOpen,
  Car,
  UserCheck,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldAlert,
  Search,
  CheckCircle2,
  Mail,
  Clock,
} from 'lucide-react';
import styles from '../info.module.css';

export default function HelpPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [openItems, setOpenItems] = useState({
    'get-1': true, // Open the first item by default
  });

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const toggleAccordion = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const faqCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      iconClass: styles.iconWrapper,
      desc: 'Account setup, discovering rides, and posting your first journey.',
      items: [
        {
          id: 'get-1',
          question: 'How do I create and use a Raahi account?',
          answer:
            'You can sign up or log in using your email or phone number from the home screen. Once logged in, your session is saved locally so you can easily access your ride search, ride offers, bookings, and notifications anytime.',
        },
        {
          id: 'get-2',
          question: 'How do I find a ride on Raahi?',
          answer:
            'Click on "Find Rides" from the navigation bar or home screen. Enter your starting origin, destination, and preferred travel date. Raahi will display matching rides with route details, driver ratings, price per seat, and available seats. You can filter and sort results according to your schedule.',
        },
        {
          id: 'get-3',
          question: 'How do I offer a ride as a driver?',
          answer:
            'Click on "Offer a Ride" or the plus (+) icon. Fill in your departure point, destination, date, departure time, total available passenger seats, vehicle model and license number, and the price contribution per seat. Once published, interested passengers along your route can find and request your ride.',
        },
        {
          id: 'get-4',
          question: 'How do I request a ride?',
          answer:
            'Browse the available rides matching your route and select the ride card that fits your schedule. Specify how many seats you need, review your pickup and drop-off points, and optionally add a short message for the driver. Click "Request Ride" to send your booking request directly to the driver.',
        },
        {
          id: 'get-5',
          question: 'How does a driver accept a ride request?',
          answer:
            'When a passenger sends a request, the driver receives an in-app notification and sees the pending request under the "My Rides" management section. Drivers can inspect the passenger profile, requested seat count, and pickup/drop locations before clicking "Accept" or "Decline". Once accepted, the seats are reserved and the ride is confirmed.',
        },
        {
          id: 'get-6',
          question: 'How do I manage my rides?',
          answer:
            'Navigate to "My Rides" from the top navigation or bottom tab bar. Here you can toggle between rides you are offering as a driver and rides you have booked as a passenger. You can view trip statuses, see passenger request details, and cancel bookings if your plans change.',
        },
      ],
    },
    {
      id: 'ride-help',
      title: 'Ride Help',
      icon: Car,
      iconClass: `${styles.iconWrapper} ${styles.iconWrapperAccent}`,
      desc: 'Everything you need to know before, during, and after your trip.',
      items: [
        {
          id: 'ride-1',
          question: 'What happens after requesting a ride?',
          answer:
            'Your request status will be marked as "Pending" until the driver reviews it. The driver can accept or decline based on seat availability and route alignment. You will receive an immediate in-app notification when the driver accepts your request, confirming your seat on the journey.',
        },
        {
          id: 'ride-2',
          question: 'How can I cancel a ride request?',
          answer:
            'If your request is still pending or already confirmed and your schedule changes, go to "My Rides", locate the relevant ride request, and click "Cancel Request". As a courtesy to drivers, please cancel as far in advance as possible so the seats remain available for others.',
        },
        {
          id: 'ride-3',
          question: 'How can I cancel a ride I am offering?',
          answer:
            'If you are a driver and cannot make the trip, open "My Rides", find the offered ride under "Rides I Offer", and select "Cancel Ride". This will update the ride status and notify any passengers who have requested or booked seats.',
        },
        {
          id: 'ride-4',
          question: 'What should I do if the driver or passenger does not arrive?',
          answer:
            'We recommend coordinating your pickup spot and timing beforehand. Allow a 10 to 15 minute grace period for city traffic. If the other party cannot be reached or fails to arrive, you may cancel the ride request with a note and report the no-show through the support channel.',
        },
        {
          id: 'ride-5',
          question: 'What should I do if I have a problem during a ride?',
          answer:
            'Safety and respect are paramount. In case of an emergency, immediately contact local emergency authorities (112 / Police). For non-emergency disputes or platform policy violations, politely ask the driver to stop at a safe, public area and report the incident to Raahi Support with trip details.',
        },
      ],
    },
    {
      id: 'account-help',
      title: 'Account & Verification',
      icon: UserCheck,
      iconClass: `${styles.iconWrapper} ${styles.iconWrapperAmber}`,
      desc: 'Profile management, security, and driver document verification.',
      items: [
        {
          id: 'acc-1',
          question: 'How can I update my profile information?',
          answer:
            'Go to the "Profile" page from the navigation bar. You can review your personal details, registered phone number, email address, total trips completed, and environmental CO2 savings metrics.',
        },
        {
          id: 'acc-2',
          question: 'How does driver document verification work?',
          answer:
            'To ensure a safe community, drivers submit their identity proof (such as Aadhaar card) and valid Driving License. Raahi administrators verify the legitimacy of these documents before granting verified driver status. Verified drivers display a verified badge on their ride cards.',
        },
        {
          id: 'acc-3',
          question: 'How are my account credentials and personal data secured?',
          answer:
            'Your authentication tokens and personal information are stored securely. Contact details are only shared between confirmed co-travelers for the purpose of coordinating their shared ride. Raahi does not sell your personal data to third parties.',
        },
        {
          id: 'acc-4',
          question: 'What should I do if I suspect unauthorized activity on my account?',
          answer:
            'Sign out from your active session on the Profile page immediately. If you notice unauthorized ride postings or bookings under your name, report it to the Raahi Support Desk so we can investigate and secure your account.',
        },
      ],
    },
  ];

  const displayedCategories =
    activeTab === 'all'
      ? faqCategories
      : faqCategories.filter((c) => c.id === activeTab);

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
              <LifeBuoy size={14} />
              <span>Support Desk</span>
            </div>
            <h1 className={styles.title}>Help Center</h1>
            <p className={styles.subtitle}>
              Find answers to frequently asked questions about using Raahi, booking rides, offering seats, and account safety.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab('all')}
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabActive : ''}`}
            >
              All Topics
            </button>
            <button
              onClick={() => setActiveTab('getting-started')}
              className={`${styles.tabBtn} ${activeTab === 'getting-started' ? styles.tabActive : ''}`}
            >
              Getting Started
            </button>
            <button
              onClick={() => setActiveTab('ride-help')}
              className={`${styles.tabBtn} ${activeTab === 'ride-help' ? styles.tabActive : ''}`}
            >
              Ride Help
            </button>
            <button
              onClick={() => setActiveTab('account-help')}
              className={`${styles.tabBtn} ${activeTab === 'account-help' ? styles.tabActive : ''}`}
            >
              Account & Verification
            </button>
          </div>

          {/* FAQ Sections */}
          {displayedCategories.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <section key={cat.id} className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div className={cat.iconClass}>
                    <CatIcon size={22} />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>{cat.title}</h2>
                    <p className={styles.sectionDesc}>{cat.desc}</p>
                  </div>
                </div>

                <div className={styles.accordionList}>
                  {cat.items.map((item) => {
                    const isOpen = !!openItems[item.id];
                    return (
                      <div key={item.id} className={styles.accordionItem}>
                        <button
                          onClick={() => toggleAccordion(item.id)}
                          className={styles.accordionHeader}
                          aria-expanded={isOpen}
                        >
                          <span>{item.question}</span>
                          {isOpen ? (
                            <ChevronUp size={18} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                          ) : (
                            <ChevronDown size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                          )}
                        </button>
                        {isOpen && (
                          <div className={styles.accordionContent}>
                            <p>{item.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Contact Support Section */}
          <section className={styles.contactCard}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconWrapperAccent}`}>
                <MessageSquare size={22} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>Contact Support</h2>
                <p className={styles.sectionDesc}>
                  Still have questions or facing an issue with your ride? Our support team is here to assist you.
                </p>
              </div>
            </div>

            <div className={styles.contactGrid}>
              <div className={styles.contactOption}>
                <Mail size={22} style={{ color: 'var(--primary-500)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 className={styles.calloutTitle}>Raahi Help Desk</h3>
                  <p className={styles.calloutText}>
                    For platform inquiries, account verification issues, or assistance with bookings, you can reach out through the official support channel:
                  </p>
                  <p style={{ marginTop: '8px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    support@raahi-carpool.example
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    (Placeholder support channel for platform inquiries)
                  </span>
                </div>
              </div>

              <div className={styles.contactOption}>
                <Clock size={22} style={{ color: 'var(--accent-500)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 className={styles.calloutTitle}>Support Hours & Response</h3>
                  <p className={styles.calloutText}>
                    Our help desk reviews questions and safety reports actively. Non-urgent queries are typically addressed within 24–48 hours.
                  </p>
                  <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    In case of immediate road safety emergencies, please always call emergency services (112) first.
                  </p>
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
