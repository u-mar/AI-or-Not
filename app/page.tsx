import DetectorClient from '@/components/DetectorClient';

export default function HomePage() {
  return (
    <div className="app-screen detect-screen">
      <header className="detect-page-header">
        <h1 className="detect-page-title">AI or Not</h1>
        <p className="detect-page-subtitle">Upload a photo to check if it&apos;s real or AI-generated</p>
      </header>
      <DetectorClient />
    </div>
  );
}
