import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import SettingsClient from '@/components/SettingsClient';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <header className="page-header">
        <div className="container">
          <h1>Settings</h1>
          <p>Customize your experience and manage your data.</p>
        </div>
      </header>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SettingsClient />
        </div>
      </section>
      <Footer minimal />
    </>
  );
}
