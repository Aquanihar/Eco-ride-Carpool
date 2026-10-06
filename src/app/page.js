'use client';

import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar/Navbar';
import Hero from '@/components/Hero/Hero';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import Footer from '@/components/Footer/Footer';
import LoginPage from '@/components/LoginPage/LoginPage';
import LaunchScreen from '@/components/LaunchScreen/LaunchScreen';

function HomePage() {
  const { isLoggedIn, loginUser } = useApp();
  const [showLaunch, setShowLaunch] = useState(true);

  return (
    <>
      {showLaunch && (
        <LaunchScreen onFinish={() => setShowLaunch(false)} />
      )}
      {!isLoggedIn ? (
        <LoginPage onComplete={loginUser} />
      ) : (
        <>
          <Navbar />
          <main>
            <Hero />
            <HowItWorks />
          </main>
          <Footer />
        </>
      )}
    </>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <HomePage />
    </AppProvider>
  );
}
