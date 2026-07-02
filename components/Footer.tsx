import Link from 'next/link';
import { APP_CONFIG } from '@/lib/config';

export default function Footer({ minimal = false }: { minimal?: boolean }) {
  if (minimal) {
    return (
      <footer className="footer">
        <div className="container">
          <div className="footer-bottom" style={{ border: 'none', paddingTop: 0 }}>
            <span>&copy; 2026 AI or Not</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <span className="logo-icon">🧠</span>
              <span>AI or Not</span>
            </Link>
            <p>Detect AI-generated images with machine learning. Built as a final-year university project.</p>
          </div>
          <div>
            <h4>Product</h4>
            <ul className="footer-links">
              <li><Link href="/#detect">Detect</Link></li>
              <li><Link href="/history">History</Link></li>
              <li><Link href="/settings">Settings</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul className="footer-links">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><Link href="/settings#privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 AI or Not. All rights reserved.</span>
          <span>v{APP_CONFIG.version}</span>
        </div>
      </div>
    </footer>
  );
}
