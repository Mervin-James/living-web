// Intent-focused tracking script (privacy-safe)
const ANALYTICS_URL = 'http://localhost:8000/api/analytics';
const STOP_URL = 'http://localhost:8000/api/analytics/stop';
const myId = Math.floor(Math.random() * 1000000);

function now() { return Date.now(); }

function throttle(fn, wait) {
  let last = 0; let pending;
  return function throttled(...args) {
    const ts = now();
    if (ts - last >= wait) {
      last = ts; fn.apply(this, args);
    } else if (!pending) {
      pending = setTimeout(() => { pending = null; last = now(); fn.apply(this, args); }, wait - (ts - last));
    }
  };
}

function debounce(fn, wait) {
  let t; return function debounced(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
}

function safeText(el) {
  try {
    const txt = (el && (el.innerText || el.textContent || el.alt || el.title || '')) || '';
    return String(txt).trim().replace(/\s+/g, ' ').slice(0, 120);
  } catch (_) { return ''; }
}

function elementMeta(el) {
  if (!el) return {};
  const tag = (el.tagName || '').toLowerCase();
  return {
    elementId: el.id || '',
    elementType: tag,
    elementClasses: (el.classList ? Array.from(el.classList).slice(0, 3).join(' ') : '') || '',
    elementRole: el.getAttribute && (el.getAttribute('role') || ''),
    elementName: el.getAttribute && (el.getAttribute('name') || el.getAttribute('aria-label') || el.getAttribute('title') || ''),
    isDestination: (el.getAttribute && (el.getAttribute('data-destination') || 'false')) || 'false',
    elementContent: safeText(el),
  };
}

function basePayload(eventType, extra) {
  return Object.assign({
    myId,
    eventType,
    ts: now(),
    path: location.pathname,
    url: location.href,
    title: document.title,
    vpW: window.innerWidth,
    vpH: window.innerHeight,
  }, extra || {});
}

function send(eventType, extra) {
  try {
    const payload = basePayload(eventType, extra);
    fetch(ANALYTICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (_) {}
}

let stopSent = false;
function sendStop(reason) {
  if (stopSent) return; stopSent = true;
  const payload = JSON.stringify({ myId, reason, ts: now(), path: location.pathname, url: location.href });
    if (navigator.sendBeacon) {
    try { const ok = navigator.sendBeacon(STOP_URL, new Blob([payload], { type: 'application/json' })); if (ok) return; } catch (_) {}
  }
  try {
    fetch(STOP_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
        return;
    } catch (_) {}
    try {
    const xhr = new XMLHttpRequest(); xhr.open('POST', STOP_URL, false); xhr.setRequestHeader('Content-Type', 'application/json'); xhr.send(payload);
    } catch (_) {}
}

function startTracking() { send('session_start', {}); }
function stopTracking(reason = 'manual') { sendStop(reason); }

// Clicks (incl. outbound and rage clicks)
const recentClicks = [];
function onClick(e) {
  const target = e.target;
  const clickable = target.closest ? target.closest('a, button, [role="button"], [data-destination="true"]') || target : target;
  const meta = elementMeta(clickable);
  let href = '';
  let outbound = false;
  const anchor = clickable.closest ? clickable.closest('a') : null;
  if (anchor && anchor.href) {
    href = anchor.href;
    try { outbound = new URL(href).hostname !== location.hostname; } catch (_) {}
  }
  send('click', Object.assign({}, meta, { href, outbound }));

  const ts = now();
  recentClicks.push({ ts, x: e.pageX, y: e.pageY });
  while (recentClicks.length > 5) recentClicks.shift();
  const windowMs = 800;
  const cluster = recentClicks.filter(c => ts - c.ts <= windowMs);
  if (cluster.length >= 3) {
    const xs = cluster.map(c => c.x); const ys = cluster.map(c => c.y);
    const spreadX = Math.max(...xs) - Math.min(...xs);
    const spreadY = Math.max(...ys) - Math.min(...ys);
    if (spreadX < 50 && spreadY < 50) send('rage_click', { count: cluster.length });
  }
}

// Hover dwell on CTAs
const hoverStart = new WeakMap();
function onMouseOver(e) {
  const el = e.target.closest && e.target.closest('a, button, [role="button"], [data-destination="true"], [data-track-hover]');
  if (!el) return; hoverStart.set(el, now());
}
function onMouseOut(e) {
  const el = e.target.closest && e.target.closest('a, button, [role="button"], [data-destination="true"], [data-track-hover]');
  if (!el) return; const start = hoverStart.get(el); if (!start) return;
  const dwell = now() - start; hoverStart.delete(el);
  if (dwell >= 600) send('hover_dwell', Object.assign({ dwell }, elementMeta(el)));
}

// Input interactions (privacy-safe)
const inputThrottlePerEl = new WeakMap();
function onInput(e) {
  const el = e.target;
  const tag = (el.tagName || '').toLowerCase();
  if (!(tag === 'input' || tag === 'textarea' || el.isContentEditable)) return;
  const type = (el.getAttribute && (el.getAttribute('type') || '')).toLowerCase();
  if (type === 'password') return;
  const last = inputThrottlePerEl.get(el) || 0;
  if (now() - last < 2000) return; // throttle per element
  inputThrottlePerEl.set(el, now());
  const length = (el.value && String(el.value).length) || 0;
  send('input_change', Object.assign({ fieldType: type || tag, length }, elementMeta(el)));
}

function onFocusIn(e) {
  const el = e.target;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || el.isContentEditable || el.getAttribute('role') === 'combobox') {
    const type = (el.getAttribute && (el.getAttribute('type') || '')).toLowerCase();
    send('focus', Object.assign({ fieldType: type || tag }, elementMeta(el)));
  }
}

function onFormSubmit(e) {
  const form = e.target;
  if (!form || form.tagName.toLowerCase() !== 'form') return;
  const fields = Array.from(form.elements || [])
    .filter(el => el && el.name && el.type !== 'password')
    .map(el => ({ name: el.name, type: el.type || el.tagName.toLowerCase() }));
  send('form_submit', Object.assign({ fields }, elementMeta(form)));
}

// Selection / copy / context menu
let lastSelectionLen = 0;
const reportSelection = debounce(() => {
  const sel = window.getSelection && window.getSelection();
  if (!sel || !sel.toString) return;
  const len = (sel.toString() || '').length;
  if (len >= 20 && len !== lastSelectionLen) {
    lastSelectionLen = len; send('text_select', { length: len });
  }
}, 400);

function onCopy(_) {
  const sel = window.getSelection && window.getSelection();
  const len = sel ? (sel.toString() || '').length : 0;
  send('copy', { length: len });
}

function onContextMenu(e) { send('context_menu', elementMeta(e.target)); }

// Online / offline
function onOnline() { send('online', {}); }
function onOffline() { send('offline', {}); }

// Resize (debounced)
const onResize = debounce(() => { send('resize', { vpW: window.innerWidth, vpH: window.innerHeight }); }, 500);

// Idle / active
let lastActivityTs = now();
let idle = false;
function markActivity() {
  lastActivityTs = now();
  if (idle) { idle = false; send('active', {}); }
}
setInterval(() => {
  if (!idle && now() - lastActivityTs > 60000) { idle = true; send('idle', {}); }
}, 5000);

// Scroll depth milestones
const depthMilestones = [25, 50, 75, 90, 100];
const sentDepth = new Set();
const handleScroll = throttle(() => {
  markActivity();
  const doc = document.documentElement || document.body;
  const scrollTop = (window.pageYOffset || doc.scrollTop || 0);
  const scrollHeight = (doc.scrollHeight || 0) - (window.innerHeight || 0);
  if (scrollHeight <= 0) return;
  const pct = Math.round((scrollTop / scrollHeight) * 100);
  for (const m of depthMilestones) {
    if (pct >= m && !sentDepth.has(m)) {
      sentDepth.add(m); send('scroll_depth', { percent: m });
    }
  }
}, 400);

// SPA route changes (history API)
function patchHistory(method) {
  const orig = history[method];
  history[method] = function patchedState() {
    const ret = orig.apply(this, arguments);
    try { window.dispatchEvent(new Event('routechange')); } catch (_) {}
    return ret;
  };
}
try { patchHistory('pushState'); patchHistory('replaceState'); } catch (_) {}
window.addEventListener('popstate', () => window.dispatchEvent(new Event('routechange')));
window.addEventListener('routechange', () => send('route_change', { path: location.pathname, url: location.href }));

// Impressions for marked elements
function setupImpressions() {
  if (!('IntersectionObserver' in window)) return;
  const seen = new WeakSet();
  const observer = new IntersectionObserver((entries) => {
    const nowTs = now();
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        const el = entry.target;
        if (seen.has(el)) return;
        // Hold for minimal dwell
        setTimeout(() => {
          if (seen.has(el)) return;
          if (!document.body.contains(el)) return;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          if (entry.rootBounds || el.getBoundingClientRect) {
            seen.add(el);
            send('impression', elementMeta(el));
          }
        }, 400);
      }
    });
  }, { threshold: [0.5] });
  document.querySelectorAll('[data-track="impression"], [data-impression]')
    .forEach(el => observer.observe(el));
}

// Wire up
function init() {
  startTracking();
  document.addEventListener('click', onClick, { capture: true });
  document.addEventListener('mouseover', onMouseOver, { capture: true });
  document.addEventListener('mouseout', onMouseOut, { capture: true });
  document.addEventListener('input', onInput, { capture: true });
  document.addEventListener('focusin', onFocusIn, { capture: true });
  document.addEventListener('submit', onFormSubmit, { capture: true });
  document.addEventListener('selectionchange', reportSelection, { capture: true });
  document.addEventListener('copy', onCopy, { capture: true });
  document.addEventListener('contextmenu', onContextMenu, { capture: true });
  document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  ['mousemove','keydown','wheel','touchstart','scroll'].forEach(evt => document.addEventListener(evt, markActivity, { passive: true }));
  setupImpressions();
}

init();

// Robust stop triggers
window.addEventListener('pagehide', () => stopTracking('pagehide'), { capture: true });
window.addEventListener('beforeunload', () => stopTracking('beforeunload'), { capture: true });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') stopTracking('hidden'); }, { capture: true });