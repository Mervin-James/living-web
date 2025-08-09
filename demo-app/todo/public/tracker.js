function logInteraction(interactionEvent) {
    const element = interactionEvent.target;
    const elementId = element.id;
    const elementContent = element.textContent;
    const elementType = element.tagName;
    const interactionType = interactionEvent.type;
    const isDestination = element.getAttribute('data-destination') || false;


    fetch('http://localhost:8000/api/analytics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ elementId, elementContent, elementType, interactionType, isDestination }),
    });

}

function startTracking() {
    console.log('Starting tracking');
    fetch('http://localhost:8000/api/analytics/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

function stopTracking() {
    console.log('Stopping tracking');
    fetch('http://localhost:8000/api/analytics/stop', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

startTracking();

document.addEventListener('mouseover', logInteraction);
document.addEventListener('scroll', logInteraction);
document.addEventListener('click', logInteraction);
document.addEventListener('onunload', stopTracking);