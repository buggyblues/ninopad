import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { load } from 'cheerio';
import i18next from 'i18next';
import { options, localeURL } from '../src/language.js';
import { renderRobots } from '../src/crawlers.js';
import { addGrowthContent } from './growth-content.mjs';
import { applyEditorialContent, editorialDates } from './editorial-content.mjs';
import { appStoreURL, appStoreProductURL, campaignToken } from '../src/growth.js';
import growthConfig from '../src/growth-config.json' with { type: 'json' };
const origin = 'https://ninopad.com';
const languages = ['zh-CN', 'en'];
const catalogs = Object.fromEntries(languages.map(l => [l, JSON.parse(readFileSync(`src/locales/${l}.json`))]));
const pages = readdirSync('src/pages', { recursive: true }).filter(f => f.endsWith('.html'));
const pageRoutes = new Set(pages.map(file => file === 'index.html' ? '/' : '/' + file.slice(0,-5)));
const routes = [];
for (const language of languages) {
  const manifest = JSON.parse(readFileSync('public/site.webmanifest'));
  Object.assign(manifest, { name: language === 'en' ? 'NinoPad' : '奶猫妙控',
    short_name: language === 'en' ? 'NinoPad' : '奶猫妙控', lang: language,
    description: catalogs[language]['index.attr_000'], start_url: '/',
    icons: manifest.icons.map(icon => ({ ...icon, src: '/' + icon.src.replace(/^\//, '') })) });
  writeFileSync(`public/site-${language}.webmanifest`, JSON.stringify(manifest, null, 2));
  mkdirSync(`src/locales/${language}`, { recursive: true });
  const ui = Object.fromEntries(Object.entries(catalogs[language]).filter(([key]) => key.startsWith('ui.')));
  writeFileSync(`src/locales/${language}/ui.json`, JSON.stringify(ui));
  for (const file of pages) {
    const page = file.slice(0,-5).replaceAll('/', '_');
    const values = Object.fromEntries(Object.entries(catalogs[language]).filter(([key]) => key.startsWith(page + '.')));
    writeFileSync(`src/locales/${language}/${page}.json`, JSON.stringify(values));
    const instance = i18next.createInstance();
    await instance.init({ ...options, lng: language, resources: { [language]: { translation: values } } });
    const $ = load(readFileSync(`src/pages/${file}`, 'utf8'));
    $('html').attr('lang', language).attr('data-page', page);
    $('link[rel="manifest"]').attr('href', `/site-${language}.webmanifest`);
    $('[data-i18n-text]').each((_, node) => {
      for (const [index, key] of Object.entries(JSON.parse($(node).attr('data-i18n-text')))) node.children[Number(index)].data = instance.t(key);
    });
    $('[data-i18n-attrs]').each((_, node) => {
      for (const [attr, key] of Object.entries(JSON.parse($(node).attr('data-i18n-attrs')))) $(node).attr(attr, instance.t(key));
    });
    $('[data-i18n-schema]').each((_, node) => $(node).text(JSON.stringify(instance.t($(node).attr('data-i18n-schema'), { returnObjects: true })).replaceAll('<', '\\u003c')));
    applyEditorialContent($, page, language, values);
    addGrowthContent($, page, language, catalogs[language]);
    $('.brand[href=""], .legal-back[href=""]').attr('href','/');
    const canonical = localeURL(page, language);
    if (!$('link[rel="canonical"]').length) $('head').append('<link rel="canonical">');
    $('link[rel="canonical"]').attr('href', canonical);
    $('meta[property="og:url"]').attr('content', canonical);
    $('meta[property="og:locale"]').attr('content', language === 'en' ? 'en_US' : 'zh_CN');
    $('link[rel="alternate"]').remove();
    for (const lng of languages) $('head').append(`<link rel="alternate" hreflang="${lng}" href="${localeURL(page, lng)}">`);
    $('head').append(`<link rel="alternate" hreflang="x-default" href="${localeURL(page, 'zh-CN')}">`);
    $('meta[name="apple-itunes-app"]').remove();
    $('head').append('<meta name="apple-itunes-app">');
    $('meta[name="apple-itunes-app"]').attr('content', `app-id=6805378609, affiliate-data=pt=${growthConfig.appStoreProviderToken}&ct=${campaignToken(page,language,'banner')}&mt=8`);
    $('meta[name="viewport"]').attr('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    $('[data-lang-switch], .mobile-drawer-lang a').each((_, node) => {
      const fixed = $(node).closest('.mobile-drawer-lang').length ? ($(node).text().includes('English') ? 'en' : 'zh-CN') : undefined;
      const target = fixed || (language === 'en' ? 'zh-CN' : 'en');
      $(node).attr('data-lang-switch', '').attr('href', `${localeURL(page, target).replace(origin,'')}?lng=${target}`);
      if (fixed) $(node).attr('data-language', fixed);
      $(node).removeAttr('data-i18n-text').removeAttr('data-i18n-attrs').text(target === 'en' ? 'English' : '简体中文');
      $(node).attr('aria-label', target === 'en' ? 'Switch to English' : '切换至中文').toggleClass('is-active', target === language);
    });
    // Preserve anchors and give static crawlers language-specific internal links.
    // The visitor detector still resolves language independently of these URLs.
    $('a[href]').each((_, node) => {
      let url = $(node).attr('href');
      if (/^\/?(?:\.\.\/)*[^:?#]+\.html(?:#.*)?$/.test(url)) {
        const parsed = new URL(url, origin + '/' + file);
        const path = parsed.pathname.replace(/\.html$/, '');
        const name = path.split('/').at(-1);
        const route = name === 'index' ? '/' : pageRoutes.has('/' + name) ? '/' + name
          : pageRoutes.has('/blog/' + name) ? '/blog/' + name : path;
        url = route + parsed.search + parsed.hash;
      }
      if (/^\/[^/?#]+(?:[?#].*)?$/.test(url)) {
        const parsed = new URL(url, origin);
        if (!pageRoutes.has(parsed.pathname) && pageRoutes.has('/blog' + parsed.pathname)) {
          url = '/blog' + parsed.pathname + parsed.search + parsed.hash;
        }
      }
      if (language === 'en' && url.startsWith('/') && !$(node).is('[data-lang-switch]')) {
        const parsed = new URL(url, origin);
        if (pageRoutes.has(parsed.pathname)) url = '/en' + parsed.pathname + parsed.search + parsed.hash;
      }
      $(node).attr('href', url);
    });
    $('a[href*="apps.apple.com/"]').each((_,node)=>{
      const placement = $(node).closest('[data-cta-placement]').attr('data-cta-placement') || $(node).closest('section[id]').attr('id') || ($(node).closest('footer').length ? 'footer' : 'content');
      $(node).attr('href',appStoreURL(growthConfig.appStoreProviderToken,page,language,placement));
    });
    if (language === 'en') $('[data-blog-href]').each((_, node) => {
      const route = $(node).attr('data-blog-href');
      if (pageRoutes.has(route)) $(node).attr('data-blog-href', '/en' + route);
    });
    
    $('img[src], [data-image]').each((_, node) => {
      for (const attr of ['src','data-image']) {
        const source = $(node).attr(attr);
        if (source?.includes('/assets/screens/')) {
          const name = source.split('/assets/screens/')[1];
          $(node).attr('data-screen', name).attr(attr, `/assets/screens/${language}/${name}`);
        }
      }
    });
    $('img[src*="app-store-zh-cn-black"]').attr('data-store-badge','').attr('src', `/assets/badges/app-store-${language === 'en' ? 'en' : 'zh-cn'}-black.svg`);
    // Social cards use exactly the same localized capture as visible content.
    const image = ['blog', 'blog_remote-control-mac'].includes(page) ? undefined : $('main img[data-screen]').first().attr('src');
    if (image) for (const selector of ['meta[property="og:image"]','meta[name="twitter:image"]']) $(selector).attr('content', origin + image).attr('data-localized-social', image.split('/assets/screens/')[1].split('/').slice(1).join('/'));
    if (image) {
      const caption = $('main img[data-screen]').first().attr('alt') || $('h1').text().trim();
      values[page + '.social_image_alt'] = caption;
      for (const [attribute, name] of [['property','og:image:alt'],['name','twitter:image:alt']]) {
        const selector = `meta[${attribute}="${name}"]`;
        if (!$(selector).length) $('head').append(`<meta ${attribute}="${name}">`);
        $(selector).attr('content',caption).attr('data-i18n-attrs', JSON.stringify({content:page + '.social_image_alt'}));
      }
    }
    $('head').append(`<meta property="og:locale:alternate" content="${language === 'en' ? 'zh_CN' : 'en_US'}">`);
    // Capture-independent application data is shared; no invented ratings.
    const graph = [];
    const productURL = appStoreProductURL(language === 'zh-CN' ? 'cn' : 'us');
    const organization = { '@type':'Organization', '@id':origin+'/#organization', name:'NinoPad', alternateName:'奶猫妙控', url:origin+'/', logo:origin+'/assets/app-icon.png', sameAs:['https://github.com/buggyblues/ninopad',appStoreProductURL('cn'),appStoreProductURL('us')] };
    if (page === 'index') graph.push(organization, { '@type':'WebSite', '@id':origin+'/#website', url:origin+'/', name:'NinoPad', alternateName:'奶猫妙控', inLanguage:['zh-CN','en'], publisher:{'@id':organization['@id']} });
    graph.push({ '@type':'WebPage', '@id':canonical+'#page', url:canonical, name:$('title').text(), description:$('meta[name="description"]').attr('content'), inLanguage:language, isPartOf:{'@id':origin+'/#website'}, publisher:{'@id':organization['@id']} });
    if (page === 'index') graph.push({ '@type':'SoftwareApplication', '@id':origin+'/#software', name:'NinoPad', alternateName:'奶猫妙控', applicationCategory:'UtilitiesApplication', operatingSystem:'iOS 17+, iPadOS 17+, macOS 13+', installUrl:productURL, downloadUrl:[productURL,'https://github.com/buggyblues/ninopad/releases/latest'], offers:{ '@type':'Offer', price:'0', priceCurrency:'USD' }, inLanguage:language, description:$('meta[name="description"]').attr('content') });
    const faqs = $('main details').toArray().map(n => ({ '@type':'Question', name:$(n).find('summary').text().trim(), acceptedAnswer:{ '@type':'Answer', text:$(n).find('p').text().trim() } })).filter(q=>q.name && q.acceptedAnswer.text);
    if (faqs.length) graph.push({ '@type':'FAQPage', inLanguage:language, mainEntity:faqs });
    if (page.startsWith('blog_')) {
      graph.push({ '@type':'BlogPosting', headline:$('h1').text().trim(), description:$('meta[name="description"]').attr('content'), inLanguage:language, datePublished:$('meta[property="article:published_time"]').attr('content'), ...(editorialDates[page] ? { dateModified: editorialDates[page] } : {}), author:{'@type':'Organization',name:'NinoPad',url:origin+'/'}, publisher:organization, mainEntityOfPage:canonical, image:image ? [origin+image] : [origin+'/assets/app-icon.png'] });
      graph.push({ '@type':'BreadcrumbList', itemListElement:[{ '@type':'ListItem', position:1, name:catalogs[language]['ui.home'], item:localeURL('index',language) },{ '@type':'ListItem', position:2, name:catalogs[language]['ui.guides'], item:localeURL('blog',language) },{ '@type':'ListItem', position:3, name:$('h1').text().trim(), item:canonical }] });
    }
    // Existing schemas are translated resources; fresh visible-content schemas
    // cover FAQs and product facts and never depend on hidden copy.
    $('[data-i18n-schema]').remove();
    $('head').append(`<script type="application/ld+json" data-seo-graph data-i18n-schema="${page}.visible_schema">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c')}</script>`);
    values[page + '.visible_schema'] = { '@context': 'https://schema.org', '@graph': graph };
    writeFileSync(`src/locales/${language}/${page}.json`, JSON.stringify(values));
    const output = (language === 'en' ? 'en/' : '') + file;
    mkdirSync(output.slice(0,output.lastIndexOf('/')+1) || '.', { recursive:true });
    writeFileSync(output, $.html());
    if (page !== '404') routes.push({ page, language, url:canonical, lastmod:editorialDates[page] });
  }
}
const escape = s => s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const xml = routes.map(({page,url,lastmod}) => `<url><loc>${escape(url)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${languages.map(l=>`<xhtml:link rel="alternate" hreflang="${l}" href="${escape(localeURL(page,l))}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${escape(localeURL(page,'zh-CN'))}"/></url>`).join('\n');
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${xml}</urlset>\n`);
for (const language of languages) {
  const urls = routes.filter(route=>route.language===language).map(({url,lastmod})=>`<url><loc>${escape(url)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('\n');
  writeFileSync(`public/sitemap-${language}.xml`,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`);
}
writeFileSync('public/sitemap-index.xml',`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${languages.map(l=>`<sitemap><loc>${origin}/sitemap-${l}.xml</loc></sitemap>`).join('')}</sitemapindex>\n`);
writeFileSync('public/robots.txt', renderRobots(origin));
const facts = `# NinoPad

NinoPad is an iPhone and iPad keypad and control deck for Mac.

## Verified product facts
- iOS / iPadOS 17 or later; Mac companion requires macOS 13 or later, Apple Silicon or Intel.
- Remote control uses a paired Mac on the local network; no cloud relay carries control traffic. Optional iCloud sync and third-party services have separate data flows.
- Accessibility permission enables Mac input. Screen Recording permission is required only for desktop mirroring.
- Coding and terminal features run through software installed on the paired Mac. NinoPad includes no AI model subscription or API keys.
- Local sampler, synthesizer, guitar and calculator features can run without a Mac connection; some features require Pro.
- Basic controls are free. Pro offers weekly, annual and lifetime purchase options. Local App Store checkout supplies the applicable price and terms.
- Website images show the actual native App with synthetic demonstration data.

## Official downloads
- [iPhone and iPad — international storefront](${appStoreProductURL('us')})
- [iPhone and iPad — China storefront](${appStoreProductURL('cn')})
- [Mac companion](https://github.com/buggyblues/ninopad/releases/latest)
- [Support](https://ninopad.com/support)
- [Privacy](https://ninopad.com/privacy)
- [Terms](https://ninopad.com/terms)

`;
const guideLists = languages.map(language => `## ${language === 'en' ? 'English guides' : '中文指南'}
` + routes.filter(r=>r.language===language && r.page.startsWith('blog_')).map(r=>{
  const file = `${language === 'en' ? 'en/' : ''}${r.page.replace('blog_','blog/')}.html`;
  const $ = load(readFileSync(file,'utf8'));
  return `- [${$('h1').text().trim()}](${r.url}): ${$('meta[name=description]').attr('content')}`;
}).join('\n'));
writeFileSync('public/llms.txt',facts + guideLists.join('\n\n') + '\n');
const fullGuides = languages.map(language => routes.filter(r=>r.language===language && r.page.startsWith('blog_')).map(r=>{
  const file = `${language === 'en' ? 'en/' : ''}${r.page.replace('blog_','blog/')}.html`;
  const $ = load(readFileSync(file,'utf8'));
  const sections = $('article.article-body').find('h2,h3,p,li,figcaption').toArray().map(n=>{
    const content = $(n).text().replace(/\s+/g,' ').trim();
    return n.name==='h2' ? '### '+content : n.name==='h3' ? '#### '+content : n.name==='li' ? '- '+content : content;
  }).filter(Boolean);
  return `## ${$('h1').text().trim()}\nSource: ${r.url}\nLanguage: ${language}\n\n`+sections.join('\n\n');
}).join('\n\n')).join('\n\n');
writeFileSync('public/llms-full.txt', facts + languages.map(language=>{
  const $ = load(readFileSync(language === 'en' ? 'en/index.html' : 'index.html','utf8'));
  return `## ${language} FAQ\n` + $('main details').toArray().map(n=>`### ${$(n).find('summary').text().trim()}\n${$(n).find('p').text().trim()}`).join('\n\n');
}).join('\n\n') + '\n\n' + guideLists.join('\n\n') + '\n\n' + fullGuides + '\n');
console.log(`Rendered ${pages.length} shared templates in ${languages.length} languages.`);
