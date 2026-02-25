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

// Simple modal popup utility
function showPopup(message, timeout = 2500) {
  let overlay = document.getElementById('site-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'site-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-live="polite">
        <p id="site-modal-message"></p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const msg = overlay.querySelector('#site-modal-message');
  msg.textContent = message;

  // make sure overlay is visible (re-append if removed)
  if (!document.body.contains(overlay)) document.body.appendChild(overlay);

  // move focus into overlay for accessibility
  const dialog = overlay.querySelector('[role="dialog"]');
  if (dialog) dialog.setAttribute('tabindex', '-1');
  if (dialog) dialog.focus();

  if (timeout > 0) {
    clearTimeout(overlay._dismissTimer);
    overlay._dismissTimer = setTimeout(() => {
      overlay.remove();
    }, timeout);
  }
}

// Contact form
const contactForm = document.querySelector('section#contact .contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showPopup("Thank you for contacting us. We'll get back to you shortly");
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const payload = Object.fromEntries(new FormData(contactForm));
    payload.formType = 'contact';

    try {
      const resp = await fetch('http://localhost:3000/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // read response body for actionable messages
      let respBodyText = await resp.text();
      let respBody = null;
      try { respBody = JSON.parse(respBodyText); } catch (e) { /* not JSON */ }

      if (resp.status === 200) {
        if (status) status.textContent = 'Message sent!';
        showPopup('Message sent!');
      } else if (resp.status === 400) {
        const errMsg = respBody && respBody.error ? respBody.error : 'Validation error (400)';
        if (status) status.textContent = 'Validation error (400)';
        showPopup('Validation Error. Please try again.');
      } else if (resp.status === 404) {
        if (status) status.textContent = 'Not found (404)';
        showPopup('Not found (404)');
      } else if (resp.status === 500) {
        if (status) status.textContent = 'Server error (500)';
        showPopup('Server error (500)');
      } else {
        const msg = `Response: ${resp.status}`;
        if (status) status.textContent = msg;
        showPopup(msg);
      }

      // Keep response visible in DevTools network as well
      console.log('Submit response', resp.status, respBodyText);
    } catch (err) {
      if (status) status.textContent = 'Network error';
      showPopup('Network error — please check your connection');
      console.error(err);
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
      showPopup('Validation Error. Please try again.');
      return;
    }

    // Send to backend
    const payload = Object.fromEntries(new FormData(loginForm));
    payload.formType = 'login';

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';

    if (submitBtn) {
      const rect = submitBtn.getBoundingClientRect();
      submitBtn.style.width = `${Math.ceil(rect.width)}px`;
    }

    fetch('http://localhost:3000/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (resp) => {
        const text = await resp.text();
        let body = null;
        try { body = JSON.parse(text); } catch (e) { /* ignore */ }
        if (resp.status === 200) {
          if (loginMsg) loginMsg.textContent = 'Logged in';
          if (submitBtn) {
            submitBtn.textContent = 'Logged in';
            submitBtn.classList.add('btn-success');
          }
          showPopup('Logged in');
        } else if (resp.status === 400) {
          const err = body && body.error ? body.error : 'Validation error (400)';
          if (loginMsg) loginMsg.textContent = 'Validation error (400)';
          showPopup('Validation Error. Please try again.');
        } else if (resp.status === 404) {
          if (loginMsg) loginMsg.textContent = 'Not found (404)';
          showPopup('Not found (404)');
        } else if (resp.status === 500) {
          if (loginMsg) loginMsg.textContent = 'Server error (500)';
          showPopup('Server error (500)');
        } else {
          if (loginMsg) loginMsg.textContent = `Response: ${resp.status}`;
          showPopup(`Response: ${resp.status}`);
        }
        console.log('Login response', resp.status, text);
      })
      .catch((err) => {
        if (loginMsg) loginMsg.textContent = 'Network error';
        showPopup('Network error — please check your connection');
        console.error(err);
      })
      .finally(() => {
        if (submitBtn) {
          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.width = '';
            submitBtn.classList.remove('btn-success');
          }, 2000);
        }
      });
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

    // Send to backend
    const payload = Object.fromEntries(new FormData(signupForm));
    payload.formType = 'signup';

    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      const rect = submitBtn.getBoundingClientRect();
      submitBtn.style.width = `${Math.ceil(rect.width)}px`;
    }

    fetch('http://localhost:3000/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (resp) => {
        const text = await resp.text();
        let body = null;
        try { body = JSON.parse(text); } catch (e) { /* ignore */ }
        if (resp.status === 200) {
          if (signupMsg) signupMsg.textContent = 'Account created';
          if (submitBtn) {
            submitBtn.textContent = 'Account created';
            submitBtn.classList.add('btn-success');
          }
          showPopup('Account created');
        } else if (resp.status === 400) {
          const err = body && body.error ? body.error : 'Validation error (400)';
          if (signupMsg) signupMsg.textContent = 'Validation error (400)';
          showPopup('Validation Error. Please try again.');
        } else if (resp.status === 404) {
          if (signupMsg) signupMsg.textContent = 'Not found (404)';
          showPopup('Not found (404)');
        } else if (resp.status === 500) {
          if (signupMsg) signupMsg.textContent = 'Server error (500)';
          showPopup('Server error (500)');
        } else {
          if (signupMsg) signupMsg.textContent = `Response: ${resp.status}`;
          showPopup(`Response: ${resp.status}`);
        }
        console.log('Signup response', resp.status, text);
      })
      .catch((err) => {
        if (signupMsg) signupMsg.textContent = 'Network error';
        showPopup('Network error — please check your connection');
        console.error(err);
      })
      .finally(() => {
        if (submitBtn) {
          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.width = '';
            submitBtn.classList.remove('btn-success');
          }, 2000);
        }
      });
  });
}
