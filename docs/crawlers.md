# Public crawler access

Updated 2026-10-02. NinoPad allows all crawlers to fetch public website content, including search indexing, AI answers, advertising validation and model training. `User-agent: *` covers clients with unpublished or changing names. Specific crawler groups have identical permissions; source, build scripts and test directories remain excluded from crawling.

The single registry is `src/crawlers.js`. It contains official documentation links beside each provider's tokens and drives both `scripts/render.mjs` and browser language preservation. Edit this source rather than generated `public/robots.txt`.

| Coverage | Providers |
| --- | --- |
| China | Baidu, Sogou, 360 Search, Shenma, ByteDance Toutiao / Bytespider |
| International search | Google, Microsoft Bing, Apple, DuckDuckGo, Yahoo, Yandex |
| AI retrieval and training | OpenAI, Anthropic Claude, Perplexity, Mistral, Meta, Amazon, Common Crawl |
| Default access | Every other client, including DeepSeek, Kimi, Doubao, Tencent Yuanbao, Grok, Brave and You.com |

For the default-access services, this audit did not establish a current operator-published crawler identity. Do not invent names such as `DeepSeekBot` or assume a service exclusively uses one crawler. Bytespider is identified as ByteDance's Toutiao crawler, not proof that all Doubao retrieval uses it.

Google-Extended, Googlebot-News and Applebot-Extended are robots policy controls rather than independent HTTP user agents. Toutiao's additional robots token comes from Cloudflare's verified crawler registry. The Meta and ByteDance identities also use Cloudflare's registry because their linked operator documentation was unavailable during this audit. Other providers link directly to their operator documentation.

## Verify a change

Run `npm run check`: crawler regressions check bilingual rendering, public page and asset permissions, and consistent internal-directory exclusions. The build validates all 74 generated pages. After publishing, compare the live `https://ninopad.com/robots.txt` to `dist/robots.txt`; fetch the homepage and an English guide with representative user agents and check HTTP status, canonical, document language and rendering assets.

Changing a User-Agent in a local request checks HTTP access from the testing connection. It does not authenticate the crawler or prove access from every operator IP. No firewall bypass is granted by this registry. If an operator later reports 403, 429, a challenge or a timeout, inspect the hosting security logs and use that operator's current IP verification mechanism before changing an edge rule.

Crawler permission does not establish that a provider has fetched, indexed, ranked or cited a page. GA measures browser visits and is a separate data pipeline.
