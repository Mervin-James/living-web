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

myId = Math.floor(Math.random() * 1000000);

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

function stopTracking() {
    console.log('Stopping tracking');
    fetch('http://localhost:8000/api/analytics/stop', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ myId }),
    });
}

startTracking();

// document.addEventListener('mouseover', logInteraction);
document.addEventListener('scroll', logInteraction);
document.addEventListener('click', logInteraction);
document.addEventListener('onunload', stopTracking);