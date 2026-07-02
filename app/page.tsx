import DetectorClient from '@/components/DetectorClient';

export default function HomePage() {
  return (
    <div className="app-screen detect-screen">
      <header className="screen-header">
        <h1 className="screen-title">Detect</h1>
        <p className="screen-subtitle">Real or AI-generated?</p>
      </header>
      <DetectorClient />
    </div>
  );
}
