export function campaignToken(page, language, placement = 'content') {
  const names = { index: 'home', 'blog_remote-control-mac': 'remote', 'blog_custom-keypad': 'macros', 'blog_mac-settings': 'setup', 'blog_presentation-tools': 'slides' };
  const slug = (names[page] || page.replace(/^blog_/, '')).replace(/[^a-z0-9-]/gi, '').slice(0, 12);
  const area = placement.replace(/[^a-z0-9-]/gi, '').slice(0, 7) || 'content';
  return `web-${language === 'en' ? 'en' : 'zh'}-${slug}-${area}`.slice(0, 30);
}

export function appStoreProductURL(storefront = 'us') {
  // These are Apple's actual product URLs, verified through the public lookup
  // API. Generic /app/id links can currently redirect to the Today page.
  return new URL(storefront === 'cn'
    ? 'https://apps.apple.com/cn/app/奶猫妙控-ninopad-随心全能小键盘/id6805378609'
    : 'https://apps.apple.com/us/app/ninopad/id6805378609').href;
}

export function browserStorefront(language = '') {
  return /^zh(?:-CN|-Hans(?:-CN)?)?$/i.test(language) ? 'cn' : 'us';
}

export function appStoreURL(provider, page, language, placement, storefront = language === 'zh-CN' ? 'cn' : 'us') {
  const url = new URL(appStoreProductURL(storefront));
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
