import { describe, it, expect, beforeEach, vi } from 'vitest';

const loadApp = async () => {
  vi.resetModules();
  await import('../../app.js');
};

describe('app.js unit tests', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.body.innerHTML = `
      <button id="cta-button">Run demo action</button>
      <p id="status" role="status">Ready.</p>
      <button id="theme-toggle" aria-pressed="false">Toggle theme</button>
      <form class="contact-form">
        <label>Email <input id="email" type="email" required /></label>
        <label>Message <textarea id="message" required></textarea></label>
        <button type="submit">Send message</button>
      </form>
    `;
  });

  it('cycles demo status text and data-state on each click', async () => {
    await loadApp();

    const button = document.querySelector('#cta-button');
    const status = document.querySelector('#status');

    button.click();
    expect(status.textContent).toBe('Running...');
    expect(status.dataset.state).toBe('running');

    button.click();
    expect(status.textContent).toBe('Done!');
    expect(status.dataset.state).toBe('done-');
  });

  it('toggles theme class and aria-pressed', async () => {
    await loadApp();

    const toggle = document.querySelector('#theme-toggle');

    toggle.click();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');

    toggle.click();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
  });

  it('updates status on form submit', async () => {
    await loadApp();

    const form = document.querySelector('.contact-form');
    const status = document.querySelector('#status');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(status.textContent).toBe('Message sent!');
  });
});
