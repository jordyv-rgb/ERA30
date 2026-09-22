/* ============================================================
   ERA 30 — Pool After Dark
   Frontend Logic
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     CONFIGURATION
     ────────────────────────────────────────────────────────── */

  /*  ┌──────────────────────────────────────────────────────┐
      │  PASTE YOUR DEPLOYED APPS SCRIPT WEB APP URL BELOW  │
      │                                                      │
      │  It will look something like:                        │
      │  https://script.google.com/macros/s/AKfyc.../exec   │
      └──────────────────────────────────────────────────────┘ */
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOTwux13UKRj-Cgv5jI_TpXArD1foj04o2sIjr7pKvJEwf6uZZRqgKcZ2D1a4ZftT6DA/exec';

  // Countdown to the start of October 3 in Houston. No party start time has been announced yet.
  const EVENT_DATE = new Date('2026-10-03T00:00:00-05:00');

  // Google Calendar link (all-day event)
  const CALENDAR_URL = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=ERA+30%3A+Pool+After+Dark'
    + '&dates=20261003/20261004'
    + '&location=Houston%2C+TX'
    + '&details=Secret+hotel+location+will+be+released+to+confirmed+guests.+Contact%3A+(832)+589-0424';

  // Public RSVP URL — update after GitHub Pages is live
  const SHARE_URL = window.location.href;
  const SHARE_TEXT = 'ERA 30: Pool After Dark — October 3, Houston TX. RSVP here:';

  /* ──────────────────────────────────────────────────────────
     DOM REFS
     ────────────────────────────────────────────────────────── */
  const $ = (sel) => document.querySelector(sel);
  const form         = $('#rsvp-form');
  const ctaBtn       = $('#cta-btn');
  const nameInput    = $('#name');
  const phoneInput   = $('#phone');
  const gcValue      = $('#gc-value');
  const gcHidden     = $('#guest-count');
  const gcMinus      = $('#gc-minus');
  const gcPlus       = $('#gc-plus');
  const notesInput   = $('#notes');
  const honeypot     = $('#website');
  const formError    = $('#form-error');
  const introEl      = $('#rsvp-intro');
  const confEl       = $('#confirmation');
  const canvas       = $('#confetti-canvas');

  /* ──────────────────────────────────────────────────────────
     COUNTDOWN
     ────────────────────────────────────────────────────────── */
  function updateCountdown() {
    const now  = Date.now();
    const diff = EVENT_DATE.getTime() - now;

    if (diff <= 0) {
      $('#cd-days').textContent = '0';
      $('#cd-hrs').textContent  = '0';
      $('#cd-min').textContent  = '0';
      $('#cd-sec').textContent  = '0';
      $('#countdown').classList.add('countdown-done');
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    $('#cd-days').textContent = d;
    $('#cd-hrs').textContent  = h;
    $('#cd-min').textContent  = m;
    $('#cd-sec').textContent  = s;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ──────────────────────────────────────────────────────────
     PHONE FORMATTING
     ────────────────────────────────────────────────────────── */
  phoneInput.addEventListener('input', function () {
    let raw = this.value.replace(/\D/g, '');
    // Strip leading 1 (US country code)
    if (raw.length > 10 && raw[0] === '1') raw = raw.slice(1);
    raw = raw.slice(0, 10);

    let formatted = '';
    if (raw.length > 0) formatted = '(' + raw.slice(0, 3);
    if (raw.length >= 3) formatted += ') ' + raw.slice(3, 6);
    if (raw.length >= 6) formatted += '-' + raw.slice(6);

    this.value = formatted;
  });

  /* ──────────────────────────────────────────────────────────
     GUEST COUNT CONTROLS
     ────────────────────────────────────────────────────────── */
  let guestCount = 1;
  const GUEST_MIN = 1;
  const GUEST_MAX = 10;

  function setGuestCount(n) {
    guestCount = Math.min(GUEST_MAX, Math.max(GUEST_MIN, n));
    gcValue.textContent = guestCount;
    gcHidden.value = guestCount;
  }

  gcMinus.addEventListener('click', () => setGuestCount(guestCount - 1));
  gcPlus.addEventListener('click', () => setGuestCount(guestCount + 1));

  /* ──────────────────────────────────────────────────────────
     FORM VALIDATION
     ────────────────────────────────────────────────────────── */
  function showError(msg) {
    formError.textContent = msg;
  }
  function clearError() {
    formError.textContent = '';
  }

  function validateForm() {
    clearError();

    const name = nameInput.value.trim();
    if (!name || name.length < 2) {
      showError('Enter your full name.');
      nameInput.focus();
      return null;
    }

    const phoneRaw = phoneInput.value.replace(/\D/g, '');
    if (phoneRaw.length !== 10) {
      showError('Enter a valid 10-digit U.S. phone number.');
      phoneInput.focus();
      return null;
    }

    // Honeypot check
    if (honeypot.value) return null;

    return {
      name:       name,
      phone:      phoneRaw,
      guestCount: guestCount,
      notes:      notesInput.value.trim().slice(0, 500),
      website:    honeypot.value
    };
  }

  /* ──────────────────────────────────────────────────────────
     SUBMISSION
     ────────────────────────────────────────────────────────── */
  let submitted = false;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Prevent duplicate clicks
    if (submitted) return;

    const data = validateForm();
    if (!data) return;

    submitted = true;
    ctaBtn.classList.add('is-loading');
    ctaBtn.disabled = true;

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      if (!res.ok) throw new Error('The RSVP server did not accept the request.');

      let result;
      try {
        result = await res.json();
      } catch {
        throw new Error('RSVP could not be verified. Please try again.');
      }

      if (result.status === 'ok') {
        showConfirmation();
      } else {
        throw new Error(result.message || 'Something went wrong.');
      }

    } catch (err) {
      ctaBtn.classList.remove('is-loading');
      ctaBtn.disabled = false;
      submitted = false;
      showError(err.message || 'Couldn\u2019t submit. Try again in a moment.');
    }
  });

  /* ──────────────────────────────────────────────────────────
     CONFIRMATION REVEAL
     ────────────────────────────────────────────────────────── */
  function showConfirmation() {
    // Animate form out
    introEl.classList.add('is-exiting');
    form.classList.add('is-exiting');

    setTimeout(() => {
      form.style.display = 'none';
      introEl.style.display = 'none';
      confEl.classList.add('is-visible');
      confEl.setAttribute('aria-hidden', 'false');

      // Fire confetti
      launchConfetti();

      // Scroll confirmation into view
      confEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 450);
  }

  /* ──────────────────────────────────────────────────────────
     CONFETTI
     ────────────────────────────────────────────────────────── */
  function launchConfetti() {
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const colors = ['#c9a14c', '#d9b86c', '#1a7fd4', '#f0ece4', '#76c9ff', '#ffe08a'];
    const pieces = [];
    const TOTAL = 120;

    for (let i = 0; i < TOTAL; i++) {
      pieces.push({
        x:  Math.random() * W,
        y:  -10 - Math.random() * H * 0.5,
        w:  4 + Math.random() * 6,
        h:  8 + Math.random() * 10,
        c:  colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        a:  Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.15,
        o:  1
      });
    }

    let frame = 0;
    const MAX_FRAMES = 200;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      let alive = false;

      for (const p of pieces) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.04;          // gravity
        p.a  += p.va;
        if (frame > MAX_FRAMES * 0.6) {
          p.o = Math.max(0, p.o - 0.015);
        }

        if (p.o > 0 && p.y < H + 20) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.a);
          ctx.globalAlpha = p.o;
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      frame++;
      if (alive && frame < MAX_FRAMES) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    }

    // Respect reduced-motion preference
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw();
    }
  }

  /* ──────────────────────────────────────────────────────────
     ADD TO CALENDAR
     ────────────────────────────────────────────────────────── */
  $('#btn-calendar').addEventListener('click', function () {
    window.open(CALENDAR_URL, '_blank', 'noopener');
  });

  /* ──────────────────────────────────────────────────────────
     SHARE
     ────────────────────────────────────────────────────────── */
  $('#btn-share').addEventListener('click', async function () {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ERA 30', text: SHARE_TEXT, url: SHARE_URL });
      } catch { /* user cancelled */ }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(SHARE_URL);
        this.textContent = 'Link Copied!';
        setTimeout(() => { this.textContent = 'Share'; }, 2000);
      } catch {
        // Last resort — select & copy via prompt
        window.prompt('Copy the RSVP link:', SHARE_URL);
      }
    }
  });

})();
