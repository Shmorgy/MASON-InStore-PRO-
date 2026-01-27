let activeRipple = null;

/* -------------------------------
   Utilities
-------------------------------- */

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4)),
  ];
}

function cleanupRipple(ripple) {
  if (!ripple) return;

  ripple.elements.forEach(el => {
    const rgb = ripple.originalColors.get(el);
    if (rgb) {
      el.style.color = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    }
  });
}

/* -------------------------------
   Ripple Trigger
-------------------------------- */

export function triggerTextRipple(event) {
  const x = event?.clientX ?? window.innerWidth / 2;
  const y = event?.clientY ?? window.innerHeight / 2;

  const elements = Array.from(
    document.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, span, button, a, label, div"
    )
  );

  /* ---- cancel & clean previous ripple ---- */
  if (activeRipple) {
    cancelAnimationFrame(activeRipple.frame);
    cleanupRipple(activeRipple);
    activeRipple = null;
  }

  const startTime = performance.now();
  const duration = 1600;
  const maxDistance = Math.hypot(window.innerWidth, window.innerHeight);

  /* ---- snapshot original colors ONCE ---- */
  const originalColors = new Map();
  elements.forEach(el => {
    const rgb = getComputedStyle(el).color.match(/\d+/g)?.map(Number);
    if (rgb) originalColors.set(el, rgb);
  });

  function animate(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const radius = progress * maxDistance;

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - x;
      const dy = rect.top + rect.height / 2 - y;
      const distance = Math.hypot(dx, dy);

      const ringThickness = 50;
      const fadeLength = 100;
      const delta = Math.abs(distance - radius);

      const orig = originalColors.get(el);
      if (!orig) return;

      if (delta <= ringThickness + fadeLength) {
        const intensity =
          delta <= ringThickness
            ? 1
            : 1 - (delta - ringThickness) / fadeLength;

        const hue =
          (distance / maxDistance) * 360 + progress * 360;

        const ripple = hslToRgb(hue % 360, 100, 60);

        el.style.color = `rgb(
          ${Math.round(orig[0] * (1 - intensity) + ripple[0] * intensity)},
          ${Math.round(orig[1] * (1 - intensity) + ripple[1] * intensity)},
          ${Math.round(orig[2] * (1 - intensity) + ripple[2] * intensity)}
        )`;
      } else {
        el.style.color = `rgb(${orig[0]},${orig[1]},${orig[2]})`;
      }
    });

    if (progress < 1) {
      activeRipple.frame = requestAnimationFrame(animate);
    } else {
      cleanupRipple(activeRipple);
      activeRipple = null;
    }
  }

  activeRipple = {
    frame: requestAnimationFrame(animate),
    elements,
    originalColors,
  };
}
