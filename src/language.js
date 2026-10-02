import { isKnownCrawler } from './crawlers.js';
export const supportedLanguages = ['zh-CN', 'en'];
export const detection = {
  order: ['querystring', 'localStorage', 'navigator'],
  lookupQuerystring: 'lng',
  lookupLocalStorage: 'ninopad_lang',
  // Persist only an explicit choice, so browser-language changes still work.
  caches: [],
  convertDetectedLanguage: (value) => /^zh(?:-|$)/i.test(value) ? 'zh-CN' : value.toLowerCase().split('-')[0]
};
export const options = {
  supportedLngs: supportedLanguages,
  fallbackLng: 'en',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  initAsync: false
};
// Crawlers must retain each prerendered document's language to index both
// catalogs. Human visitors always use the standard browser detector above.
export function crawlerLanguage(userAgent, documentLanguage) {
  return isKnownCrawler(userAgent)
    && supportedLanguages.includes(documentLanguage) ? documentLanguage : undefined;
}
export function localeURL(page, language) {
  const route = page === 'index' ? '/' : '/' + page.replace(/^blog_/, 'blog/');
  return `https://ninopad.com${language === 'en' ? '/en' : ''}${route}`;
}
