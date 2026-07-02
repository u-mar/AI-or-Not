import { initNav } from './nav.js';
import { initTheme, initScrollReveal, initCounters, bindRipples } from './ui.js';
import { initDetector } from './detector.js';
import { initHistory } from './history.js';
import { initSettings } from './settings.js';
import { initContact } from './contact.js';
import { initPWA } from './pwa.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initScrollReveal();
  initCounters();
  bindRipples();
  initPWA();

  const page = document.body.dataset.page;
  switch (page) {
    case 'detector':
      initDetector();
      break;
    case 'history':
      initHistory();
      break;
    case 'settings':
      initSettings();
      break;
    case 'contact':
      initContact();
      break;
    default:
      break;
  }
});
