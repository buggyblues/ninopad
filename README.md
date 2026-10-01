# NinoPad website

Vite multipage website for **https://ninopad.com**, using **i18next** and **i18next-browser-languagedetector**. Chinese and English use the same templates, styles, interactions and screenshot slots.

## Develop and verify

Use Node 22.12+ (or Node 24) and npm. EdgeOne starts on its documented preinstalled Node 22.11, so its install command bootstraps pinned Node 22.22 and npm 10.9 before running `npm ci --include=optional`. This ensures Vite's platform bindings are installed under a compatible runtime. The pinned Node build dependency also supplies the npm-script runtime.

```sh
npm ci
npm run dev
npm run check
npm run preview
```

Production output is `dist/`. The existing EdgeOne Makers project (`ninopad-website`, `makers-smtejewta4a4`) uses the pinned-runtime install command, `npm run build`, and output directory `dist`. `edgeone.json` overrides the console build settings; the fallback `vercel.json` uses `npm ci` on a compatible Node runtime. Publishing follows the existing Git workflow.

## Edit content

- `src/pages/`: one HTML template per page, including the blog.
- `src/locales/zh-CN.json` and `en.json`: i18next resources for text, attributes and interaction messages.
- `src/main.js`: language detection and DOM bindings.
- `src/interactions.js`, `src/*.css`: shared presentation and interactions.
- `public/assets/`: static images, icons and verified native captures.

`npm run dev` and `npm run build` render the root, `blog/` and `en/` HTML files. Treat those files as generated output. Text-node bindings retain inline elements rather than replacing markup with translated HTML. Keep translation keys present in both catalogs. Runtime bundles load only the current page and shared interaction strings.

## Language behavior

Detection priority is an explicit `?lng=en` / `?lng=zh-CN`, a saved manual choice, then `navigator.languages`. Regional Chinese variants use `zh-CN`; supported English variants use `en`; unsupported languages fall back to English. Automatic detection is not persisted. A manual choice is saved under `ninopad_lang` and applies to all pages.

Paths are never used by the language detector. `/en/` remains a prerendered crawl and legacy link entry, with reciprocal `hreflang` and canonical URLs. A visitor using Chinese can see Chinese on `/en/`; an English visitor can see English on `/`. Manual switches preserve the page and hash.

App Store links use Apple's actual product URLs. A Simplified Chinese browser opens the China storefront even after selecting English on the website; other browser locales use the international product URL. Campaign language remains the website language. The customer's Apple Account ultimately determines the storefront where installation and payment occur.

Known search and answer-engine crawlers retain the prerendered document language so both catalogs remain indexable after JavaScript rendering. Visitor detection is independent of these crawl entries.

## Native screenshots

The app repository beside this website owns the native capture runners:

```sh
SIMULATOR_UDID=<dedicated-website-simulator> Scripts/capture-website-screenshots.sh
SIMULATOR_UDID=<dedicated-website-simulator> Scripts/WebsiteTutorials/run.sh
SIMULATOR_UDID=<dedicated-website-simulator> Scripts/WebsiteTutorials/run.sh --guides
SIMULATOR_UDID=<dedicated-website-simulator> Scripts/WebsiteTutorials/run.sh --release
Scripts/capture-macos-website-screenshot.sh
python3 Scripts/WebsiteScreenshots/publish.py --website ../cream-deck-public
```

Run these commands from the app repository. Captures go to `public/assets/screens/{zh-CN,en}/`. `data-screen` stores the shared scene path, and i18next selects the locale folder at runtime. English captures come from the actual Debug App using capture-only English resources and synthetic demonstration data. Normal release App localization is a separate project.

To run the complete pipeline with one command, use `SIMULATOR_UDID=<dedicated-website-simulator> bash Scripts/WebsiteScreenshots/generate.sh` from the app repository. Set `WEBSITE_LANGUAGES=en` to refresh English only, or `NINOPAD_WEBSITE_DIR` to target a different website checkout. The dedicated simulator is restarted to localize native Photos and share sheets.

English images require native Vision OCR without Chinese text, visible-content checks and SHA-256 provenance. `npm run build` rejects missing images, wrong language paths, unverified English captures, Chinese bound text, metadata omissions and differences between Chinese/English DOM structure. It also builds the sitemap, robots and factual `llms.txt` / `llms-full.txt` guides.

## SEO, GEO and ASO

Both languages are rendered before JavaScript runs. Every page has title/description, canonical, reciprocal language alternates and localized social images. JSON-LD is generated from visible page content; no review ratings are fabricated. The 404 page is excluded from the sitemap and has `noindex`.

Machine-readable product facts distinguish local control traffic from optional iCloud and third-party services. App Store copy lives in the app repository's `AppStore/en-US.json` and `AppStore/zh-Hans.json`; editing it does not submit an App Store release.

## Analytics and acquisition

`src/growth-config.json` contains public GA4 measurement ID `G-Q2D5L3JJ9Q` and Apple's public campaign provider token. These are identifiers, not credentials. Tracking runs only on `ninopad.com`, after the visitor accepts analytics, and respects DNT/GPC. The footer lets visitors change their choice. Local development and the 404 page do not load Google Analytics.

GA enhanced measurement is disabled. Explicit events are `page_view`, `app_store_click`, `mac_download`, `select_content`, `pricing_view`, and `language_change`. App Store clicks are a key event counted once per session with no assigned monetary value. Do not send `purchase` from the website: actual installs, purchases and proceeds belong in App Store Connect.

App Store links carry `pt=128660955`, `mt=8`, and a bounded `ct` campaign token identifying language, page and placement. They work even when analytics is declined. GA receives page paths and validated standard UTM tags; other query parameters and hashes are removed, and referrers contain only the origin.

Submit `https://ninopad.com/sitemap-index.xml` in Search Console. It references separate Chinese and English sitemaps, each with 36 indexable URLs; the original `sitemap.xml` remains available. Canonicals stay tied to the prerendered crawl entry when a visitor switches language. `llms-full.txt` includes product facts and the visible bilingual guides with their source URLs; it does not guarantee search or AI inclusion.
