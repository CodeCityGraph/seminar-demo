const ctaButton = document.querySelector('#cta-button');
const status = document.querySelector('#status');
const themeToggle = document.querySelector('#theme-toggle');

const messages = ['Running...', 'Done!', 'Ready.'];
let messageIndex = -1;

if (ctaButton && status) {
  ctaButton.addEventListener('click', () => {
    messageIndex = (messageIndex + 1) % messages.length;
    status.textContent = messages[messageIndex];
    status.dataset.state = messages[messageIndex].toLowerCase().replace(/\W+/g, '-');
  });
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    themeToggle.setAttribute('aria-pressed', String(isDark));
  });
}

const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (status) {
      status.textContent = 'Message sent!';
    }
  });
}
