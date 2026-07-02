import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <>
      <header className="about-hero">
        <div className="container">
          <h1>About <span className="text-gradient">AI or Not</span></h1>
          <p className="lead">A machine learning platform for detecting AI-generated images — built as a final-year university project.</p>
        </div>
      </header>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Pipeline</span>
            <h2>How Detection <span className="text-gradient">Works</span></h2>
          </div>
          <div className="pipeline-steps reveal">
            {[
              ['Image Upload', 'User uploads PNG, JPEG, or WEBP through the web interface.'],
              ['Feature Extraction', 'OpenCV extracts ~205 features: histograms, edges, texture, color moments.'],
              ['Logistic Regression', 'Trained classifier predicts Real vs AI-Generated.'],
              ['Result Display', 'Frontend shows prediction, confidence, and saves to local history.'],
            ].map(([title, desc]) => (
              <div key={title} className="pipeline-step">
                <div><h4>{title}</h4><p>{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-elevated)' }}>
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Technology</span>
            <h2>Tech <span className="text-gradient">Stack</span></h2>
          </div>
          <div className="tech-grid">
            <article className="tech-card glass-card reveal">
              <h3>Frontend</h3>
              <ul>
                <li>Next.js 15 + React 19</li>
                <li>TypeScript</li>
                <li>PWA support</li>
                <li>localStorage history</li>
              </ul>
            </article>
            <article className="tech-card glass-card reveal">
              <h3>Machine Learning</h3>
              <ul>
                <li>Python + scikit-learn</li>
                <li>Logistic Regression</li>
                <li>OpenCV features</li>
                <li>~205 features per image</li>
              </ul>
            </article>
            <article className="tech-card glass-card reveal">
              <h3>Backend</h3>
              <ul>
                <li>Vercel Python serverless</li>
                <li>api/predict.py</li>
                <li>Base64 image transport</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Developer</span>
            <h2>Meet the <span className="text-gradient">Developer</span></h2>
          </div>
          <div className="dev-card glass-card reveal">
            <div className="dev-avatar" aria-hidden="true">👨‍💻</div>
            <div className="dev-info">
              <h3>Project Developer</h3>
              <p>Final-year CS student passionate about ML, web development, and digital media authenticity.</p>
              <Link href="/contact" className="btn btn-ghost" style={{ marginTop: '1rem' }}>Get in touch</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer minimal />
    </>
  );
}
