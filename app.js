const ctaButton = document.querySelector('#cta-button');
const status = document.querySelector('#status');
const themeToggle = document.querySelector('#theme-toggle');
const THEME_STORAGE_KEY = 'simple-app-theme';

const messages = ['Running...', 'Done!', 'Ready.'];
let messageIndex = -1;

if (ctaButton && status) {
  ctaButton.addEventListener('click', () => {
    messageIndex = (messageIndex + 1) % messages.length;
    status.textContent = messages[messageIndex];
    status.dataset.state = messages[messageIndex].toLowerCase().replace(/\W+/g, '-');
  });
}

const setTheme = (theme) => {
  const root = document.documentElement;
  const isDark = theme === 'dark';
  root.classList.toggle('dark', isDark);
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(isDark));
  }
};

const loadStoredTheme = () => {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === 'dark' || value === 'light') {
      return value;
    }
  } catch {
    // Ignore storage errors and fall back to light theme.
  }
  return 'light';
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors when persistence is unavailable.
  }
};

setTheme(loadStoredTheme());

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    const nextTheme = isDark ? 'dark' : 'light';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    saveTheme(nextTheme);
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
