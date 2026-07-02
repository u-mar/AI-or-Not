'use client';

import { FormEvent, useState } from 'react';
import { useToast } from './useToast';

export default function ContactForm() {
  const { show, ToastContainer } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name') as string)?.trim();
    const email = (fd.get('email') as string)?.trim();
    const message = (fd.get('message') as string)?.trim();

    if (!name || !email || !message) {
      show('Please fill in all required fields', 'error');
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      show('Please enter a valid email address', 'error');
      setLoading(false);
      return;
    }

    show("Message sent! We'll get back to you soon.");
    e.currentTarget.reset();
    setLoading(false);
  };

  return (
    <>
      <ToastContainer />
      <form onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input type="text" id="name" name="name" placeholder="Your name" required maxLength={100} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input type="email" id="email" name="email" placeholder="you@example.com" required maxLength={254} />
        </div>
        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <select id="subject" name="subject" defaultValue="general">
            <option value="general">General Inquiry</option>
            <option value="feedback">Feedback</option>
            <option value="bug">Bug Report</option>
            <option value="collaboration">Collaboration</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea id="message" name="message" placeholder="Your message..." required maxLength={5000} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-ripple" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </>
  );
}
