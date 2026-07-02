import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import HistoryClient from '@/components/HistoryClient';

export const metadata: Metadata = { title: 'History' };

export default function HistoryPage() {
  return (
    <>
      <header className="page-header">
        <div className="container">
          <h1>Scan History</h1>
          <p>Review your previous analyses. All data is stored locally on your device.</p>
        </div>
      </header>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <HistoryClient />
        </div>
      </section>
      <Footer minimal />
    </>
  );
}
