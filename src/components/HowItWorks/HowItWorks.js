'use client';

import {
  MapPin,
  Users,
  Route,
  Shield,
  Leaf,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import styles from './HowItWorks.module.css';

const STEPS = [
  {
    icon: MapPin,
    title: 'Set Your Route',
    description: 'Enter your pickup and drop-off points. Our smart system maps out your entire journey.',
    color: 'emerald',
  },
  {
    icon: Route,
    title: 'Smart Route Match',
    description:
      "We find drivers whose routes pass through your pickup & drop. If it's on their way, it's a match!",
    color: 'cyan',
  },
  {
    icon: Users,
    title: 'Ride Together',
    description:
      'Connect with your co-rider, share the journey, split costs, and reduce one more car on the road.',
    color: 'amber',
  },
];

const FEATURES = [
  {
    icon: Route,
    title: 'Route-Based Matching',
    description:
      "Unlike destination-only apps, Raahi matches along the entire route. If someone's path overlaps with yours, you ride together.",
  },
  {
    icon: Shield,
    title: 'Verified & Safe',
    description:
      'Every driver is verified with ID, license, and vehicle docs. Real-time trip sharing keeps you safe.',
  },
  {
    icon: Leaf,
    title: 'Carbon Tracker',
    description:
      "See exactly how much CO₂ you've saved per ride. Track your eco-impact and earn green badges.",
  },
  {
    icon: Wallet,
    title: 'Fair Cost Splitting',
    description:
      'Automatic fare calculation based on distance. Drivers earn, riders save — everyone wins.',
  },
];

export default function HowItWorks() {
  return (
    <>
      {/* How It Works */}
      <section className={`section ${styles.section}`} id="how-it-works">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="badge badge-primary">How It Works</span>
            <h2 className="heading-lg">Three Steps to a Greener Commute</h2>
            <p className="text-lg">
              Getting started is ridiculously simple. Find rides in seconds.
            </p>
          </div>

          <div className={styles.steps}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className={styles.step}>
                  <div className={`${styles.stepNumber}`}>
                    <span>{i + 1}</span>
                  </div>
                  <div className={`${styles.stepIconWrap} ${styles[step.color]}`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="heading-md">{step.title}</h3>
                  <p className="text-base">{step.description}</p>
                  {i < STEPS.length - 1 && (
                    <div className={styles.connector}>
                      <ArrowRight size={20} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`section ${styles.featuresSection}`} id="features">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="badge badge-accent">Why Raahi?</span>
            <h2 className="heading-lg">
              Built for <span className="gradient-text">Smarter</span> Rides
            </h2>
            <p className="text-lg">
              Every feature designed to make carpooling effortless and impactful.
            </p>
          </div>

          <div className={styles.features}>
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className={`card ${styles.featureCard}`}>
                  <div className={styles.featureIcon}>
                    <Icon size={24} />
                  </div>
                  <h3 className="heading-sm">{feat.title}</h3>
                  <p className="text-base">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
