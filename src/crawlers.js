// Verified on 2026-10-02. This identifies rendering clients, never authenticates
// requests or bypasses a firewall. Public crawling uses the same rules for all.
export const crawlerProviders = [
  { name: 'Google', agents: ['Googlebot', 'Googlebot-Image', 'Googlebot-Video', 'GoogleOther', 'GoogleOther-Image', 'GoogleOther-Video', 'Google-CloudVertexBot', 'AdsBot-Google', 'AdsBot-Google-Mobile'], controls: ['Googlebot-News', 'Google-Extended'], sources: ['https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers', 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-special-case-crawlers'] },
  { name: 'Microsoft Bing', agents: ['bingbot', 'adidxbot', 'BingPreview', 'MicrosoftPreview', 'BingVideoPreview'], sources: ['https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0'] },
  { name: 'OpenAI', agents: ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'OAI-AdsBot'], sources: ['https://developers.openai.com/api/docs/bots'] },
  { name: 'Anthropic Claude', agents: ['ClaudeBot', 'Claude-SearchBot', 'Claude-User'], sources: ['https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler'] },
  { name: 'Perplexity', agents: ['PerplexityBot', 'Perplexity-User'], sources: ['https://docs.perplexity.ai/docs/resources/perplexity-crawlers'] },
  { name: 'Mistral', agents: ['MistralAI-User', 'MistralAI-Index', 'MistralAI-Training'], sources: ['https://docs.mistral.ai/robots'] },
  { name: 'Apple', agents: ['Applebot'], controls: ['Applebot-Extended'], sources: ['https://support.apple.com/en-us/119829'] },
  { name: 'DuckDuckGo', agents: ['DuckDuckBot', 'DuckAssistBot'], sources: ['https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot', 'https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot'] },
  { name: 'Yahoo', agents: ['Slurp'], sources: ['https://help.yahoo.com/kb/search-for-desktop/learn-slurp-sln22600.html'] },
  { name: 'Yandex', agents: ['YandexBot'], sources: ['https://yandex.com/support/webmaster/en/robot-workings/check-yandex-robots'] },
  { name: 'Baidu', agents: ['Baiduspider'], sources: ['https://www.baidu.com/search/robots_english.html'] },
  { name: 'Sogou', agents: ['Sogou web spider'], sources: ['https://zhanzhang.sogou.com/index.php/help/spider'] },
  { name: '360 Search', agents: ['360Spider', '360Spider-Image', '360Spider-Video'], sources: ['https://www.so.com/help/help_3_2.html', 'https://www.so.com/help/spider_ip.html'] },
  { name: 'Shenma', agents: ['YisouSpider'], sources: ['https://zhanzhang.sm.cn/open/optimizaGuide'] },
  { name: 'ByteDance Toutiao', agents: ['Bytespider'], controls: ['zhanzhang.toutiao.com'], sources: ['https://radar.cloudflare.com/bots/directory/bytedance-toutiao'] },
  { name: 'Meta', agents: ['meta-externalagent', 'meta-externalfetcher'], sources: ['https://radar.cloudflare.com/bots/directory/meta-externalagent', 'https://radar.cloudflare.com/bots/directory/meta-externalfetcher'] },
  { name: 'Amazon', agents: ['Amazonbot', 'Amzn-SearchBot', 'Amzn-User'], sources: ['https://developer.amazon.com/amazonbot'] },
  { name: 'Common Crawl', agents: ['CCBot'], sources: ['https://commoncrawl.org/ccbot'] }
];

export const crawlerAgents = crawlerProviders.flatMap(provider => provider.agents);
export const robotsAgents = crawlerProviders.flatMap(provider => [...provider.agents, ...(provider.controls || [])]);
const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const crawlerPattern = new RegExp(`(?:^|[^a-z0-9-])(?:${crawlerAgents.map(escapePattern).join('|')})(?=$|[^a-z0-9-])`, 'i');

export function isKnownCrawler(userAgent) {
  return crawlerPattern.test(userAgent);
}

export function renderRobots(origin) {
  const policy = 'Allow: /\nDisallow: /src/\nDisallow: /scripts/\nDisallow: /test/\n';
  // Specific groups do not inherit wildcard rules: keep both policies identical.
  return '# Public pages and rendering assets are open to every crawler.\n'
    + `User-agent: *\n${policy}\n`
    + '# Search, AI retrieval, advertising and model-training agents.\n'
    + robotsAgents.map(agent => `User-agent: ${agent}`).join('\n') + '\n' + policy
    + `\nSitemap: ${origin}/sitemap-index.xml\n`;
}
