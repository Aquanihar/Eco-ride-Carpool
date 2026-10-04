'use client';

import { AppProvider, useApp } from '@/context/AppContext';
import Navbar from '@/components/Navbar/Navbar';
import Hero from '@/components/Hero/Hero';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import Footer from '@/components/Footer/Footer';
import LoginPage from '@/components/LoginPage/LoginPage';

function HomePage() {
  const { isLoggedIn, loginUser } = useApp();

  if (!isLoggedIn) {
    return <LoginPage onComplete={loginUser} />;
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
      </main>
      <Footer />
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
