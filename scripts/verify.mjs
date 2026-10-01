import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import assert from 'node:assert/strict';
import growthConfig from '../src/growth-config.json' with { type:'json' };
assert(/^G-[A-Z0-9]+$/.test(growthConfig.ga4MeasurementId));
const pages = readdirSync('src/pages', { recursive:true }).filter(f=>f.endsWith('.html'));
const screenshotHashes = new Map();
function manifests(dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir,{withFileTypes:true})) {
    const file = `${dir}/${e.name}`;
    if (e.isDirectory()) manifests(file);
    else if (e.name === 'capture-manifest.json') {
      const m = JSON.parse(readFileSync(file));
      if (!m.language) continue;
      assert.equal(m.nativeApp, true, `Non-native screenshot manifest ${file}`);
      for (const shot of m.scenes || m.screenshots || []) screenshotHashes.set(file.slice(0,file.lastIndexOf('/'))+'/'+(shot.file || shot.name+'.webp'), { ...shot, language:m.language });
    }
  }
}
manifests('dist/assets/screens');
for (const file of pages) {
  let shape;
  for (const language of ['zh-CN','en']) {
    const output = `dist/${language==='en' ? 'en/' : ''}${file}`;
    assert(existsSync(output), `Missing page ${output}`);
    const $ = load(readFileSync(output,'utf8'));
    assert.equal($('html').attr('lang'), language);
    assert.equal($('h1').length,1, `One heading required: ${output}`);
    assert($('title').text().trim());
    assert($('meta[name="description"]').attr('content')?.trim());
    assert.equal($('link[rel="canonical"]').length,1);
    assert.equal($('link[rel="alternate"]').length,3);
    assert.equal($('[data-analytics-consent]').length,1);
    assert.equal($('[data-consent-accept]').length,1);
    assert.equal($('[data-consent-reject]').length,1);
    if (file.startsWith('blog/')) {
      const graph = JSON.parse($('[data-seo-graph]').text())['@graph'];
      const crumbs = graph.find(node=>node['@type']==='BreadcrumbList');
      assert.equal(crumbs.itemListElement.at(-1).item,$('link[rel="canonical"]').attr('href'));
      assert($('main a[href*="apps.apple.com/"]').length,`Missing article download CTA: ${output}`);
    }
    for (const n of $('a[href*="apps.apple.com/"]').toArray()) {
      const url = new URL($(n).attr('href'));
      assert.equal(url.searchParams.get('pt'),growthConfig.appStoreProviderToken);
      assert(url.searchParams.get('ct').startsWith(`web-${language==='en'?'en':'zh'}-`));
      assert(url.searchParams.get('ct').length<=30);
    }
    for (const n of $('script[type="application/ld+json"]').toArray()) JSON.parse($(n).text());
    const bodyShape = $('body *').toArray().map(n=>n.name+':'+($(n).attr('class') || '').replace(/\bis-active\b/g,'').trim()).join('\n');
    if (shape) assert.equal(bodyShape,shape,`Language DOM divergence: ${file}`); else shape=bodyShape;
    for (const n of $('[data-i18n-text]').toArray()) {
      const text = Object.keys(JSON.parse($(n).attr('data-i18n-text'))).map(i=>n.children[+i]?.data || '').join('');
      if (language === 'en') assert(!/[\u3400-\u9fff]/u.test(text), `Chinese text in ${output}: ${text}`);
    }
    for (const n of $('a[href]').toArray()) {
      const href = $(n).attr('href');
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      const route = new URL(href,'https://ninopad.com').pathname;
      const target = route.endsWith('/') ? `dist${route}index.html`
        : route === '/en' ? 'dist/en/index.html' : /\.[a-z0-9]+$/i.test(route) ? `dist${route}` : `dist${route}.html`;
      assert(existsSync(target), `Broken internal link ${output}: ${href}`);
    }
    for (const n of $('img[src], [data-image]').toArray()) for (const attr of ['src','data-image']) {
      const src=$(n).attr(attr); if (!src || !src.startsWith('/assets/')) continue;
      const target = 'dist'+src;
      assert(existsSync(target),`Missing asset: ${target}`);
      if (src.includes('/screens/')) {
        assert(src.includes(`/screens/${language}/`), `Screenshot locale mismatch ${src}`);
        if (language === 'en') {
          const shot=screenshotHashes.get(target); assert(shot,`Missing English capture provenance ${target}`);
          assert.equal(shot.language,'en');
          const iconOnlyBoard = shot.name === 'control-presentation-board' && shot.languageNeutral === true;
          assert(Array.isArray(shot.recognizedText) && (shot.recognizedText.length || iconOnlyBoard), `Missing English OCR evidence ${target}`);
          assert.equal(createHash('sha256').update(readFileSync(target)).digest('hex'),shot.sha256 || shot.webpSHA256,`Capture changed ${target}`);
          assert(!shot.recognizedText?.some(t=>/[\u3400-\u9fff]/u.test(t)),`Chinese UI in ${target}`);
        }
      }
    }
  }
}
assert(!existsSync('dist/src'));
assert(existsSync('dist/sitemap.xml') && existsSync('dist/llms.txt'));
const sitemap = load(readFileSync('dist/sitemap-index.xml','utf8'),{xmlMode:true});
assert.equal(sitemap('sitemap').length,2);
for (const language of ['zh-CN','en']) {
  const map = load(readFileSync(`dist/sitemap-${language}.xml`,'utf8'),{xmlMode:true});
  assert.equal(map('url').length,pages.length-1);
  for (const n of map('loc').toArray()) {
    const url = new URL(map(n).text());
    assert.equal(url.origin,'https://ninopad.com');
    assert.equal(url.pathname.startsWith('/en/'),language==='en');
    assert(!url.pathname.includes('404'));
  }
}
console.log(`Verified ${pages.length*2} pages: shared structure, metadata, assets and English capture language/provenance.`);
