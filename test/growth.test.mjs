import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignToken, appStoreURL, browserStorefront, analyticsAllowed, analyticsLocation, analyticsReferrer } from '../src/growth.js';

test('App Store attribution has the real provider, locale and placement with bounded tokens', () => {
  const url = new URL(appStoreURL('128660955', 'blog_remote-control-mac', 'en', 'article'));
  assert.equal(url.searchParams.get('pt'), '128660955');
  assert.equal(url.searchParams.get('ct'), 'web-en-remote-article');
  assert.equal(url.searchParams.get('mt'), '8');
  assert.equal(url.pathname, '/us/app/ninopad/id6805378609');
  // A Chinese browser can select English on the website and still needs the
  // working China storefront, while attribution remains the website language.
  const chineseBrowser = new URL(appStoreURL('128660955', 'index', 'en', 'footer', browserStorefront('zh-CN')));
  assert(chineseBrowser.pathname.startsWith('/cn/app/'));
  assert.equal(chineseBrowser.searchParams.get('ct'), 'web-en-home-footer');
  assert.equal(browserStorefront('en-GB'), 'us');
  assert(campaignToken('blog_guide-automation-steps', 'zh-CN', 'long-placement').length <= 30);
});
test('Analytics requires production hostname, consent and no browser privacy opt-out', () => {
  const input = { hostname: 'ninopad.com', productionHostname: 'ninopad.com', consent: 'granted' };
  assert(analyticsAllowed(input));
  for (const override of [{hostname:'localhost'}, {consent:'denied'}, {consent:undefined}, {doNotTrack:'1'}, {globalPrivacyControl:true}]) assert(!analyticsAllowed({...input,...override}));
});
test('Analytics strips private query values, hashes and referrer search terms', () => {
  assert.equal(analyticsLocation('https://ninopad.com/?lng=en&email=user@example.com&token=secret&utm_source=google&utm_term=user@example.com#private'), 'https://ninopad.com/?utm_source=google');
  assert.equal(analyticsReferrer('https://www.google.com/search?q=private+search'), 'https://www.google.com/');
});
