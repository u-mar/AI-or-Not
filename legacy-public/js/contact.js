import { showToast, escapeHtml } from './ui.js';

export function initContact() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('#name')?.value?.trim();
    const email = form.querySelector('#email')?.value?.trim();
    const subject = form.querySelector('#subject')?.value?.trim();
    const message = form.querySelector('#message')?.value?.trim();

    if (!name || !email || !message) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (message.length > 5000) {
      showToast('Message is too long (max 5000 characters)', 'error');
      return;
    }

    const data = { name: escapeHtml(name), email, subject, message };
    console.log('Contact form submitted:', data);
    showToast('Message sent! We\'ll get back to you soon.');
    form.reset();
  });
}
