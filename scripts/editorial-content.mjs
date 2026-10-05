import article from '../src/content/remote-control-mac.json' with { type: 'json' };

export const editorialDates = {
  index: '2026-10-05',
  blog: '2026-10-05',
  'blog_remote-control-mac': '2026-10-05'
};

export function applyEditorialContent($, page, language, values) {
  const copy = article[language];
  let sequence = 0;
  const bind = (tag, value, className) => {
    const key = `${page}.editorial_${sequence++}`;
    values[key] = value;
    return $(`<${tag}>`).text(value).attr('data-i18n-text', JSON.stringify({ 0: key })).addClass(className || '');
  };
  const attribute = (node, name, value) => {
    const key = `${page}.editorial_${sequence++}`;
    values[key] = value;
    const bindings = JSON.parse(node.attr('data-i18n-attrs') || '{}');
    node.attr(name, value).attr('data-i18n-attrs', JSON.stringify({ ...bindings, [name]: key }));
  };
  const readingText = JSON.stringify(copy);
  const minutes = Math.max(1, Math.ceil(language === 'en'
    ? (readingText.match(/\b[a-z]+(?:['’-][a-z]+)*\b/gi) || []).length / 220
    : (readingText.match(/[\u3400-\u9fff]/gu) || []).length / 400));
  const readingLabel = language === 'en' ? `${minutes} min read` : `阅读约 ${minutes} 分钟`;
  function metadata(title, description) {
    const titleNode = $('title');
    const key = `${page}.editorial_${sequence++}`;
    values[key] = title;
    titleNode.text(title).attr('data-i18n-text', JSON.stringify({ 0: key }));
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) attribute($(selector), 'content', description);
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) attribute($(selector), 'content', title);
    // An editorial update must not select a historical App capture as its cover.
    $('meta[property="og:image"], meta[name="twitter:image"]').attr('content', 'https://ninopad.com/assets/app-icon.png').removeAttr('data-localized-social');
  }
  if (page === 'blog_remote-control-mac') {
    metadata(copy.seoTitle, copy.description);
    $('.article-header > a').remove();
    $('.article-header > h1').replaceWith(bind('h1', copy.title));
    const meta = $('<p class="article-meta">').append(bind('span', copy.updatedLabel), ' ', $('<time datetime="2026-10-05">').text('2026-10-05'), ' · ', bind('span', readingLabel));
    $('.article-header > p').replaceWith(meta);
    $('.article-cover').remove();
    const body = $('article.article-body').empty();
    copy.intro.forEach((paragraph, index) => body.append(bind('p', paragraph, index === 0 ? 'article-lead' : undefined)));
    const toc = $('<nav class="article-toc">');
    attribute(toc, 'aria-label', copy.tocTitle);
    toc.append(bind('h2', copy.tocTitle));
    const list = $('<ol>');
    for (const section of copy.sections) list.append($('<li>').append(bind('a', section.title).attr('href', `#${section.id}`)));
    toc.append(list); body.append(toc);
    for (const section of copy.sections) {
      body.append(bind('h2', section.title).attr('id', section.id));
      for (const block of section.blocks) {
        if (block.type === 'p' || block.type === 'h3') body.append(bind(block.type, block.text));
        else if (block.type === 'ol' || block.type === 'ul') {
          const list = $(`<${block.type}>`);
          for (const item of block.items) list.append(bind('li', item));
          body.append(list);
        } else if (block.type === 'table') {
          const table = $('<table class="article-table">');
          const header = $('<tr>');
          for (const heading of block.headers) header.append(bind('th', heading).attr('scope', 'col'));
          table.append($('<thead>').append(header));
          const rows = $('<tbody>');
          for (const row of block.rows) {
            const element = $('<tr>');
            for (const cell of row) element.append(bind('td', cell));
            rows.append(element);
          }
          table.append(rows); body.append($('<div class="article-table-scroll">').append(table));
        } else throw new Error(`Unsupported editorial block: ${block.type}`);
      }
    }
    const faq = $('<section class="article-search-faq" id="questions">').append(bind('h2', copy.faqTitle));
    for (const item of copy.faq) faq.append($('<details>').append(bind('summary', item.question), bind('p', item.answer)));
    body.append(faq);
    $('meta[property="article:modified_time"]').remove();
    $('head').append('<meta property="article:modified_time" content="2026-10-05">');
    // Existing related navigation is replaced by descriptive, localized links.
    $('.article-next').remove();
  }
  if (page === 'blog') {
    const description = language === 'en'
      ? 'Practical NinoPad guides for controlling Mac from iPhone or iPad. Start with installation, Wi-Fi pairing and permissions, then explore shortcut keypads and everyday workflows.'
      : 'NinoPad 实用指南：从 iPhone / iPad 遥控 Mac 的安装、Wi-Fi 配对和权限排查开始，再按需要设置快捷键面板与日常工作台。';
    metadata(language === 'en' ? 'Mac Control & Shortcut Keypad Guides | NinoPad' : 'iPhone / iPad 遥控 Mac 与快捷键使用指南 | NinoPad', description);
    $('.content-hero h1').replaceWith(bind('h1', language === 'en' ? 'Practical guides for your Mac controls' : '把手机用成顺手的 Mac 控制台'));
    $('.content-hero p').last().replaceWith(bind('p', description));
    // Keep the former featured guide reachable when promoting the full setup guide.
    const previous = $('.blog-featured').clone().removeClass('blog-featured').addClass('blog-card');
    previous.find('figure').remove();
    previous.find('h2').each((_, node) => { node.name = node.tagName = 'h3'; });
    $('.blog-grid').prepend(previous);
    const featured = $('.blog-featured').addClass('blog-featured-text').attr('href', '/blog/remote-control-mac').attr('data-blog-cat', 'settings');
    featured.find('figure').remove();
    featured.find('.blog-featured-badge').replaceWith(bind('span', language === 'en' ? 'Start here · Complete setup guide' : '从这里开始 · 完整连接指南', 'blog-featured-badge'));
    featured.find('h2').replaceWith(bind('h2', copy.title));
    featured.find('.blog-featured-content > p').replaceWith(bind('p', copy.description));
    featured.find('time').attr('datetime', '2026-10-05').text('2026-10-05');
    featured.find('.blog-meta > span').last().replaceWith(bind('span', readingLabel));
    // The article already has a prominent entry; avoid listing it twice.
    $('.blog-grid a[href="/blog/remote-control-mac"]').remove();
  }
  if (page.startsWith('blog_')) {
    const section = $('<nav class="article-related">');
    const heading = page === 'blog_remote-control-mac' ? copy.relatedTitle
      : language === 'en' ? 'Mac setup and everyday controls' : '连接 Mac 与常用操作';
    attribute(section, 'aria-label', heading);
    section.append(bind('h2', heading));
    const list = $('<ul>');
    const links = page === 'blog_remote-control-mac' ? copy.related : [
      { slug: 'remote-control-mac', title: copy.title, text: copy.description },
      ...copy.related.slice(0, 2)
    ];
    for (const item of links.filter(item => page !== `blog_${item.slug}`)) list.append($('<li>').append(bind('a', item.title).attr('href', `/blog/${item.slug}`), bind('p', item.text)));
    section.append(list); $('main').append(section);
  }
}
