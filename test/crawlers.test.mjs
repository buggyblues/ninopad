import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crawlerLanguage } from '../src/language.js';
import { renderRobots, isKnownCrawler } from '../src/crawlers.js';

test('AI fetchers and domestic search render the requested bilingual document', () => {
  const agents = [
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-AdsBot/1.0; +https://openai.com/adsbot',
    'Claude-SearchBot/1.0', 'Claude-User/1.0', 'Perplexity-User/1.0',
    'MistralAI-Index/1.0', 'meta-externalfetcher/1.1', 'Amzn-SearchBot/0.1',
    'Sogou web spider/4.0 (+http://www.sogou.com/docs/help/webmasters.htm#07)',
    'Mozilla/5.0; 360Spider', 'YisouSpider',
    'Mozilla/5.0 (compatible; Bytespider; https://zhanzhang.toutiao.com/)'
  ];
  for (const agent of agents) {
    for (const language of ['zh-CN', 'en']) assert.equal(crawlerLanguage(agent, language), language, agent);
    assert.equal(crawlerLanguage(agent, 'fr'), undefined);
  }
  assert.equal(isKnownCrawler('Mozilla/5.0 Safari/605.1.15'), false);
  assert.equal(isKnownCrawler('MyClaudeBotExtension'), false);
  assert.equal(isKnownCrawler('Google-Extended'), false); // robots control, no HTTP identity
  assert.equal(isKnownCrawler('Applebot-Extended'), false); // robots control, no HTTP identity
});

test('specific and unknown crawlers share public-page and asset permissions', () => {
  // Read the generated protocol, independently of the renderer's agent list.
  const groups = [];
  for (const block of renderRobots('https://ninopad.com').split(/\n\s*\n/)) {
    const agents = [], rules = [];
    for (const line of block.split('\n')) {
      const match = /^(User-agent|Allow|Disallow):\s*(.*)$/i.exec(line);
      if (!match) continue;
      if (match[1].toLowerCase() === 'user-agent') agents.push(match[2].toLowerCase());
      else rules.push({ allow: match[1].toLowerCase() === 'allow', path: match[2] });
    }
    if (agents.length) groups.push({ agents, rules });
  }
  function allowed(agent, path) {
    const named = groups.filter(group => group.agents.some(value => value !== '*' && agent.toLowerCase().includes(value)));
    const matching = named.length ? named : groups.filter(group => group.agents.includes('*'));
    const rules = matching.flatMap(group => group.rules).filter(rule => path.startsWith(rule.path));
    rules.sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
    return rules[0]?.allow ?? true;
  }
  for (const agent of ['OAI-AdsBot', 'GPTBot', 'Google-Extended', 'Applebot-Extended', 'Sogou web spider', 'Bytespider', 'UnpublishedAIClient']) {
    for (const path of ['/', '/en/', '/blog/remote-control-mac', '/en/blog/remote-control-mac', '/assets/app.js', '/assets/app.css', '/images/product.png', '/llms.txt', '/sitemap-index.xml']) {
      assert.equal(allowed(agent, path), true, `${agent} ${path}`);
    }
    for (const path of ['/src/main.js', '/scripts/render.mjs', '/test/language.test.mjs']) assert.equal(allowed(agent, path), false, `${agent} ${path}`);
  }
  assert.match(renderRobots('https://ninopad.com'), /^Sitemap: https:\/\/ninopad\.com\/sitemap-index\.xml$/m);
});
