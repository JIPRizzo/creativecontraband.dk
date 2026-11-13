// Public Formspree form IDs are configuration, never API secrets.
(() => {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const options = document.querySelector('.contact-options');
  const toggles = [...options.querySelectorAll('button')];
  const panels = toggles.map(toggle => document.getElementById(toggle.getAttribute('aria-controls')));
  toggles.forEach((toggle, index) => {
    panels[index].hidden = true;
    toggle.addEventListener('click', () => {
      const opening = toggle.getAttribute('aria-expanded') !== 'true';
      toggles.forEach((other, otherIndex) => {
        const expanded = opening && index === otherIndex;
        other.setAttribute('aria-expanded', String(expanded));
        panels[otherIndex].hidden = !expanded;
      });
    });
  });
  options.hidden = false;

  const message = form.querySelector('[name="message"]');
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.contact-status');
  const endpoint = form.dataset.endpoint;
  const configured = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint);
  let sending = false;
  form.addEventListener('change', (event) => {
    if (event.target.name === 'reason') message.placeholder = event.target.dataset.placeholder;
  });
  for (const field of form.querySelectorAll('[required]')) {
    field.addEventListener('input', () => field.setCustomValidity(''));
  }
  if (configured) {
    button.disabled = false;
    status.textContent = '';
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!configured || sending) return;
    for (const field of form.querySelectorAll('input[required]:not([type="radio"]), textarea[required]')) {
      field.setCustomValidity(field.value.trim() ? '' : 'Please complete this field.');
    }
    if (!form.reportValidity()) return;
    sending = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'sending';
    status.textContent = 'Sending your message…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', body: new FormData(form),
        headers: { Accept: 'application/json' }, signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error('Submission not confirmed');
      status.dataset.state = 'success';
      status.textContent = 'Thanks — your message has been sent.';
      form.reset();
      message.placeholder = "What's on your mind?";
    } catch {
      status.dataset.state = 'error';
      status.textContent = "I couldn't confirm that your message was sent. Your text is still here. Please try again, or email hola@creativecontraband.dk. Retrying may send a duplicate if the first attempt reached us.";
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
})();
