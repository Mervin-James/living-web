function logInteraction(interactionEvent) {
    const element = interactionEvent.target;
    const elementId = element.id;
    const elementContent = element.textContent || element.innerText || element.alt;
    const elementType = element.tagName;
    const interactionType = interactionEvent.type;
    const isDestination = element.getAttribute('data-destination') || 'false';


    fetch('http://localhost:8000/api/analytics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ elementId, elementContent, elementType, interactionType, isDestination, myId }),
    });

}

const myId = Math.floor(Math.random() * 1000000);
const STOP_URL = 'http://localhost:8000/api/analytics/stop';
let stopSent = false;

function sendStop(reason) {
    if (stopSent) return;
    stopSent = true;
    const payload = JSON.stringify({ myId, reason });
    // Prefer sendBeacon for unload-robust delivery
    if (navigator.sendBeacon) {
        try {
            const ok = navigator.sendBeacon(STOP_URL, new Blob([payload], { type: 'application/json' }));
            if (ok) return;
        } catch (_) {}
    }
    // Fallback to keepalive fetch
    try {
        fetch(STOP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
        }).catch(() => {});
        return;
    } catch (_) {}
    // Last resort: synchronous XHR (deprecated but reliable on some browsers)
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', STOP_URL, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
    } catch (_) {}
}

function startTracking() {
    console.log('Starting tracking');
    fetch('http://localhost:8000/api/analytics/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ myId }),
    });
}

function stopTracking(reason = 'manual') {
    console.log('Stopping tracking');
    sendStop(reason);
}

startTracking();

// document.addEventListener('mouseover', logInteraction);
document.addEventListener('scroll', logInteraction);
document.addEventListener('click', logInteraction);
document.addEventListener('focus', logInteraction);

// Robust stop triggers across browsers
window.addEventListener('pagehide', () => stopTracking('pagehide'), { capture: true });
window.addEventListener('beforeunload', () => stopTracking('beforeunload'), { capture: true });
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        stopTracking('hidden');
    }
}, { capture: true });