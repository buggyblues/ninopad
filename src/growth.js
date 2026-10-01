export function campaignToken(page, language, placement = 'content') {
  const names = { index: 'home', 'blog_remote-control-mac': 'remote', 'blog_custom-keypad': 'macros', 'blog_mac-settings': 'setup', 'blog_presentation-tools': 'slides' };
  const slug = (names[page] || page.replace(/^blog_/, '')).replace(/[^a-z0-9-]/gi, '').slice(0, 12);
  const area = placement.replace(/[^a-z0-9-]/gi, '').slice(0, 7) || 'content';
  return `web-${language === 'en' ? 'en' : 'zh'}-${slug}-${area}`.slice(0, 30);
}

export function appStoreURL(provider, page, language, placement) {
  const url = new URL('https://apps.apple.com/app/apple-store/id6805378609');
  url.searchParams.set('pt', provider);
  url.searchParams.set('ct', campaignToken(page, language, placement));
  url.searchParams.set('mt', '8');
  return url.href;
}

// Only standard, bounded campaign labels survive; query strings and fragments
// may contain private values and are never sent wholesale to Analytics.
export function analyticsLocation(href) {
  const source = new URL(href);
  const clean = new URL(source.origin + source.pathname);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = source.searchParams.get(key);
    if (value && /^[a-z0-9._-]{1,64}$/i.test(value)) clean.searchParams.set(key, value);
  }
  return clean.href;
}

export function analyticsReferrer(href) {
  try { return new URL(href).origin + '/'; } catch { return ''; }
}

export function analyticsAllowed({ hostname, productionHostname, consent, doNotTrack, globalPrivacyControl }) {
  return hostname === productionHostname && consent === 'granted' && doNotTrack !== '1' && !globalPrivacyControl;
}
