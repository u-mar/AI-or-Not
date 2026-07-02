import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <>
      <header className="page-header">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Have questions, feedback, or collaboration ideas? We&apos;d love to hear from you.</p>
        </div>
      </header>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="contact-grid">
            <aside className="contact-info-card glass-card reveal">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Get in Touch</h2>
              <a href="mailto:contact@aiornot.dev" className="contact-link">
                <span className="contact-link-icon">✉️</span>
                <div><strong>Email</strong><p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>contact@aiornot.dev</p></div>
              </a>
              <a href="#" className="contact-link">
                <span className="contact-link-icon">🔗</span>
                <div><strong>GitHub</strong><p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>github.com/aiornot</p></div>
              </a>
              <a href="#" className="contact-link">
                <span className="contact-link-icon">💼</span>
                <div><strong>LinkedIn</strong><p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>linkedin.com/in/aiornot</p></div>
              </a>
            </aside>
            <div className="contact-form-card glass-card reveal">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Send a Message</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Fill out the form and we&apos;ll get back to you.</p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
      <Footer minimal />
    </>
  );
}
