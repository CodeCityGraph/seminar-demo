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

// Contact form
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (status) {
      status.textContent = 'Message sent!';
    }
  });
}

// Login / Signup client-side validation and success-on-button behavior
const loginForm = document.getElementById('login-form');
if (loginForm) {
  // Prefer an existing success-text container
  let loginMsg = loginForm.querySelector('.success-text');
  if (!loginMsg) {
    loginMsg = document.createElement('p');
    loginMsg.className = 'help-text success-text';
    loginMsg.setAttribute('role', 'status');
    loginMsg.style.margin = '0';
    loginForm.appendChild(loginMsg);
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!loginForm.checkValidity()) {
      loginForm.reportValidity();
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      const originalText = submitBtn.textContent;
      const rect = submitBtn.getBoundingClientRect();
      submitBtn.style.width = `${Math.ceil(rect.width)}px`;
      submitBtn.textContent = 'Logged in';
      submitBtn.classList.add('btn-success');
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.style.width = '';
        submitBtn.classList.remove('btn-success');
      }, 3000);
    }
  });
}

const signupForm = document.getElementById('signup-form');
if (signupForm) {
  let signupMsg = signupForm.querySelector('.success-text');
  if (!signupMsg) {
    signupMsg = document.createElement('p');
    signupMsg.className = 'help-text success-text';
    signupMsg.setAttribute('role', 'status');
    signupMsg.style.margin = '0';
    signupForm.appendChild(signupMsg);
  }

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!signupForm.checkValidity()) {
      signupForm.reportValidity();
      return;
    }

    const submitBtn = signupForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      const originalText = submitBtn.textContent;
      const rect = submitBtn.getBoundingClientRect();
      submitBtn.style.width = `${Math.ceil(rect.width)}px`;
      submitBtn.textContent = 'Account created';
      submitBtn.classList.add('btn-success');
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.style.width = '';
        submitBtn.classList.remove('btn-success');
      }, 3000);
    }
  });
}
