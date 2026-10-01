import config from './growth-config.json';
import { analyticsAllowed, analyticsLocation, analyticsReferrer, appStoreURL } from './growth.js';

export function initializeAnalytics(i18next, page) {
  const language = i18next.resolvedLanguage;
  const banner = document.querySelector('[data-analytics-consent]');
  const settings = document.querySelector('[data-analytics-settings]');
  const preferenceKey = 'ninopad_analytics';
  let consent;
  let initialized = false;
  try { consent = localStorage.getItem(preferenceKey); } catch {}
  const privacySignal = navigator.doNotTrack === '1' || navigator.globalPrivacyControl;
  const production = location.hostname === config.productionHostname && page !== '404';

  function placement(node) {
    return node.closest('[data-cta-placement]')?.dataset.ctaPlacement
      || node.closest('section[id]')?.id || (node.closest('footer') ? 'footer' : 'content');
  }
  // Attribution works without tracking consent and uses Apple's public campaign
  // tokens, never a visitor identifier. These links also exist in static HTML.
  for (const link of document.querySelectorAll('a[href*="apps.apple.com/"]')) {
    link.href = appStoreURL(config.appStoreProviderToken, page, language, placement(link));
  }
  function event(name, parameters = {}) {
    if (!initialized || consent !== 'granted' || privacySignal) return;
    window.gtag('event', name, {
      send_to: config.ga4MeasurementId, site_language: language,
      page_id: page, content_group: page.startsWith('blog_') ? 'guides' : page,
      ...parameters
    });
  }
  function start() {
    if (!production || initialized || !analyticsAllowed({ hostname: location.hostname,
      productionHostname: config.productionHostname, consent,
      doNotTrack: navigator.doNotTrack, globalPrivacyControl: navigator.globalPrivacyControl })) return;
    initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted',
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    window.gtag('config', config.ga4MeasurementId, { send_page_view: false,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      page_location: analyticsLocation(location.href), page_referrer: analyticsReferrer(document.referrer),
      language, cookie_flags: 'SameSite=Lax;Secure' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.ga4MeasurementId}`;
    document.head.append(script);
    event('page_view', { page_title: document.title,
      page_location: analyticsLocation(location.href), page_referrer: analyticsReferrer(document.referrer) });
  }
  function choose(value) {
    consent = value;
    try { localStorage.setItem(preferenceKey, value); } catch {}
    banner.hidden = true;
    if (value === 'granted') start();
    else if (initialized) {
      // Reload after withdrawal to remove handlers and the third-party runtime.
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) continue;
        for (const domain of ['', `;domain=${location.hostname}`, `;domain=.${location.hostname}`])
          document.cookie = `${name}=;max-age=0;path=/${domain};SameSite=Lax;Secure`;
      }
      location.reload();
    }
  }
  banner?.querySelector('[data-consent-accept]')?.addEventListener('click', () => choose('granted'));
  banner?.querySelector('[data-consent-reject]')?.addEventListener('click', () => choose('denied'));
  settings?.addEventListener('click', () => { banner.hidden = false; banner.querySelector('button')?.focus(); });
  if (banner) banner.hidden = !production || privacySignal || ['granted', 'denied'].includes(consent);
  if (settings) settings.hidden = !production || privacySignal;
  start();

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (link) {
      if (link.hostname === 'apps.apple.com') event('app_store_click', { cta_placement: placement(link),
        device_target: link.closest('[data-download-panel]')?.dataset.downloadPanel || 'ios' });
      else if (link.hasAttribute('data-release-link') || /github\.com\/buggyblues\/ninopad\/releases/.test(link.href))
        event('mac_download', { cta_placement: placement(link), device_target: 'mac' });
      else if (link.hasAttribute('data-lang-switch')) event('language_change', { target_language: new URL(link.href).searchParams.get('lng') });
      else if (link.pathname.includes('/blog/')) event('select_content', { content_type: 'guide',
        item_id: link.pathname.replace(/^\/en/, ''), cta_placement: placement(link) });
    }
  }, { capture: true });
  const pricing = document.querySelector('#pro');
  if (pricing && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && initialized && consent === 'granted') {
        event('pricing_view'); observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(pricing);
  }
}
