'use client';

import { DashboardProvider } from '@/context/DashboardContext';
import Header from '@/components/layout/Header';
import Dashboard from '@/components/layout/Dashboard';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <DashboardProvider>
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Dashboard />
        </main>
        <Footer />
      </div>
    </DashboardProvider>
  );
}
