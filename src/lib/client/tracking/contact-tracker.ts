const TRACKING_ENDPOINT = '/api/v1/tracking/contact';

function getVisitorId(): string {
  let vid = localStorage.getItem('visitor_id');
  if (!vid) {
    vid = crypto.randomUUID();
    localStorage.setItem('visitor_id', vid);
  }
  return vid;
}

export function trackContact(tradeId: number, eventType: 'whatsapp' | 'email' | 'phone' | 'profile'): void {
  if ('sendBeacon' in navigator) {
    const data = JSON.stringify({ tradeId, eventType, visitorId: getVisitorId() });
    navigator.sendBeacon(TRACKING_ENDPOINT, new Blob([data], { type: 'application/json' }));
  }
}

export function initContactTracking(): void {
  document.querySelectorAll<HTMLElement>('[data-track-contact]').forEach((el) => {
    if (el.dataset.trackWired === 'true') return;
    el.dataset.trackWired = 'true';
    const tradeId = Number(el.dataset.trackContact);
    const eventType = (el.dataset.trackType || 'profile') as 'whatsapp' | 'email' | 'phone' | 'profile';
    el.addEventListener('click', () => trackContact(tradeId, eventType));
  });
}
