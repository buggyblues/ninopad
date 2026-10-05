import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { detection, options, crawlerLanguage, languageSwitchURL } from './language.js';
import { initializeAnalytics } from './analytics.js';
import './growth.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const page = document.documentElement.dataset.page;
const catalogs = import.meta.glob('./locales/*/*.json', { import: 'default' });
const resources = Object.fromEntries(await Promise.all(['zh-CN', 'en'].map(async (language) => {
  const translation = await catalogs[`./locales/${language}/${page}.json`]();
  const ui = await catalogs[`./locales/${language}/ui.json`]();
  return [language, { translation: { ...translation, ...ui } }];
})));
await i18next.use(LanguageDetector).init({ ...options, detection, resources,
  lng: crawlerLanguage(navigator.userAgent, document.documentElement.lang) });
const language = i18next.resolvedLanguage;
document.documentElement.lang = language;
document.querySelector('link[rel="manifest"]')?.setAttribute('href', `/site-${language}.webmanifest`);
// Text-node bindings preserve inline markup, focus order, and CSS layout.
for (const node of document.querySelectorAll('[data-i18n-text]')) {
  for (const [index, key] of Object.entries(JSON.parse(node.dataset.i18nText))) {
    node.childNodes[Number(index)].textContent = i18next.t(key);
  }
}
for (const node of document.querySelectorAll('[data-i18n-attrs]')) {
  for (const [attribute, key] of Object.entries(JSON.parse(node.dataset.i18nAttrs))) node.setAttribute(attribute, i18next.t(key));
}
for (const node of document.querySelectorAll('[data-i18n-schema]')) node.textContent = JSON.stringify(i18next.t(node.dataset.i18nSchema, { returnObjects: true }));
for (const node of document.querySelectorAll('[data-screen]')) {
  const image = `/assets/screens/${language}/${node.dataset.screen}`;
  node.setAttribute(node.tagName === 'IMG' ? 'src' : 'data-image', image);
}
for (const node of document.querySelectorAll('[data-store-badge]')) node.src = `/assets/badges/app-store-${language === 'en' ? 'en' : 'zh-cn'}-black.svg`;
for (const node of document.querySelectorAll('[data-lang-switch]')) {
  const target = node.dataset.language || (language === 'en' ? 'zh-CN' : 'en');
  node.textContent = target === 'en' ? 'English' : '简体中文';
  node.setAttribute('aria-label', target === 'en' ? 'Switch to English' : '切换至中文');
  const updateLanguageLink = () => { node.href = languageSwitchURL(page, target, location.href); };
  updateLanguageLink();
  window.addEventListener('hashchange', updateLanguageLink);
  node.classList.toggle('is-active', target === language);
  node.addEventListener('click', () => {
    updateLanguageLink();
    try { localStorage.setItem('ninopad_lang', target); } catch {}
  });
}
// A language preference must not change the canonical URL emitted by HTML.
const canonical = document.querySelector('link[rel="canonical"]').href;
for (const node of document.querySelectorAll('[data-localized-social]')) node.content = 'https://ninopad.com/assets/screens/' + language + '/' + node.dataset.localizedSocial;
document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
document.querySelector('meta[property="og:locale"]')?.setAttribute('content', language === 'en' ? 'en_US' : 'zh_CN');
document.querySelector('meta[property="og:locale:alternate"]')?.setAttribute('content', language === 'en' ? 'zh_CN' : 'en_US');
// Store only an explicit language choice.
if (new URL(location.href).searchParams.has('lng')) {
  try { localStorage.setItem('ninopad_lang', language); } catch {}
}
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);
window.ninopadI18n = i18next;
await import('./interactions.js');
initializeAnalytics(i18next, page);
document.documentElement.dataset.ready = 'true';
