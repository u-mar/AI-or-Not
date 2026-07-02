import Link from 'next/link';
import Footer from '@/components/Footer';
import DetectorClient from '@/components/DetectorClient';

export default function HomePage() {
  return (
    <>
      <header className="hero hero-compact">
        <div className="container hero-content">
          <div className="hero-badge reveal revealed">Powered by Machine Learning</div>
          <h1 className="reveal revealed">AI or Not</h1>
          <p className="hero-subtitle reveal revealed">Can You Trust What You See?</p>
          <p className="hero-desc reveal revealed">
            Upload an image below and our API will analyze whether it&apos;s real or AI-generated.
          </p>
        </div>
      </header>

      <section className="section detect-section" id="detect">
        <div className="container">
          <DetectorClient />
        </div>
      </section>

      <section className="section section-compact" id="features">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Features</span>
            <h2>Why Use <span className="text-gradient">AI or Not</span></h2>
          </div>
          <div className="feature-grid">
            {[
              ['Instant API Analysis', 'Results in seconds via our prediction endpoint.'],
              ['Privacy First', 'Scan history stays on your device only.'],
              ['Confidence Scores', 'See how certain the model is about each result.'],
              ['Mobile Ready', 'Works on phones, tablets, and desktop.'],
            ].map(([title, desc]) => (
              <article key={title} className="feature-card glass-card reveal">
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-compact" id="how-it-works" style={{ background: 'var(--bg-elevated)' }}>
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">How It Works</span>
            <h2>3 Simple Steps</h2>
          </div>
          <div className="steps-grid">
            {[
              ['1', 'Upload', 'Choose or take a photo on your device.'],
              ['2', 'Analyze', 'Our API extracts features and runs the model.'],
              ['3', 'Result', 'See Real or AI Generated with confidence score.'],
            ].map(([num, title, desc]) => (
              <div key={title} className="step-card glass-card reveal">
                <div className="step-num">{num}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-compact" id="faq">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">FAQ</span>
            <h2>Common Questions</h2>
          </div>
          <div className="faq-list reveal">
            <details className="faq-item">
              <summary>What formats are supported?</summary>
              <p>PNG, JPEG, JPG, and WEBP up to 10MB.</p>
            </details>
            <details className="faq-item">
              <summary>How does detection work?</summary>
              <p>Images are sent to /api/predict. The logistic regression model analyzes color, texture, and edge features.</p>
            </details>
            <details className="faq-item">
              <summary>Is my image stored?</summary>
              <p>No permanent server storage. History is saved locally in your browser only.</p>
            </details>
          </div>
          <div className="hero-cta reveal" style={{ marginTop: '2rem' }}>
            <Link href="/history" className="btn btn-secondary btn-lg">View History</Link>
            <Link href="/about" className="btn btn-ghost btn-lg">Learn More</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
