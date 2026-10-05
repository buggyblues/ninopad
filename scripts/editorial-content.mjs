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
  const readingText = [copy.intro, copy.answerPoints, copy.sections, copy.faq].flatMap(value => {
    const strings = [];
    const walk = item => {
      if (typeof item === 'string') strings.push(item);
      else if (Array.isArray(item)) item.forEach(walk);
      else if (item && typeof item === 'object') Object.entries(item).filter(([key]) => !['type','id','link','image','images'].includes(key)).forEach(([,value]) => walk(value));
    };
    walk(value); return strings;
  }).join(' ');
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
    values[`${page}.growth_breadcrumb`] = copy.title;
    metadata(copy.seoTitle, copy.description);
    $('.article-header > a').remove();
    $('.article-header > h1').replaceWith(bind('h1', copy.title));
    const meta = $('<p class="article-meta">').append(bind('span', copy.updatedLabel), ' ', $('<time datetime="2026-10-05">').text('2026-10-05'), ' · ', bind('span', readingLabel));
    $('.article-header > p').replaceWith(meta);
    $('.article-cover').remove();
    const body = $('article.article-body').empty().addClass('editorial-guide');
    copy.intro.forEach((paragraph, index) => body.append(bind('p', paragraph, index === 0 ? 'article-lead' : undefined)));
    const figures = {
      'mac-pairing': {
        width: 856, height: 1278,
        title: language === 'en' ? 'On Mac: open the pairing code' : 'Mac 端：打开配对码',
        alt: language === 'en' ? 'Native Mac companion window showing a QR code and six-digit pairing code; Chinese interface' : 'Mac 配套端的原生连接窗口，显示二维码与六位配对码',
        caption: language === 'en' ? 'Open this window from the menu bar. Scan the code on your own Mac, or enter its six-digit code.' : '从菜单栏打开此窗口，扫描你自己 Mac 上的二维码，或输入六位配对码。'
      },
      'phone-devices': {
        width: 1206, height: 2622,
        title: language === 'en' ? 'On iPhone: check the device status' : 'iPhone 端：确认设备状态',
        alt: language === 'en' ? 'Native NinoPad Devices sheet with connection status and a screen sharing switch; Chinese interface and demonstration data' : 'NinoPad 原生设备页，展示连接状态和屏幕共享开关，使用演示数据',
        caption: language === 'en' ? 'The Devices sheet shows the current connection and screen sharing switch. Device names and status here are examples.' : '设备页显示当前连接状态和屏幕共享开关。图中的设备名与状态是演示数据。'
      },
      'ipad-controls': {
        width: 2752, height: 2064,
        title: language === 'en' ? 'A trackpad and shortcuts beside your Mac' : '把触控板和常用快捷键放到手边',
        alt: language === 'en' ? 'Native NinoPad Studio workspace on iPad in landscape, with trackpad, shortcut buttons and a demonstration screen preview; Chinese interface' : 'iPad 横屏的 NinoPad 工作台，包含触控板、快捷键按钮和演示画面预览',
        caption: language === 'en' ? 'Studio workspace on iPad. The preview and device data are demonstrations of the interface.' : 'iPad 横屏工作台。画面预览与设备数据用于展示界面。'
      }
    };
    const figure = (id, eager = false) => {
      const shot = figures[id];
      if (!shot) throw new Error(`Unknown editorial screenshot: ${id}`);
      const node = $('<figure class="editorial-figure">').attr('data-editorial-figure', id);
      node.append(bind('strong', shot.title, 'editorial-figure-title'));
      const img = $('<img>').attr({src:`/assets/editorial/mac-control/${id}.webp`, width:shot.width, height:shot.height, loading:eager?'eager':'lazy', decoding:'async'});
      attribute(img,'alt',shot.alt);
      node.append($('<a>').attr({href:img.attr('src'),target:'_blank',rel:'noopener'}).append(img), bind('figcaption', shot.caption));
      return node;
    };
    const overview = $('<div class="editorial-overview">');
    const answer = $('<aside class="editorial-answer">').append(bind('h2', copy.answerTitle));
    const points = $('<ul>');
    for (const point of copy.answerPoints) points.append($('<li>').append(bind('strong',point.title),bind('p',point.text)));
    answer.append(points); overview.append(answer, figure('ipad-controls',true)); body.append(overview);
    body.append(bind('p',copy.requirements,'editorial-requirements'));
    body.append(bind('p',language === 'en' ? 'Native Chinese interface · October 2, 2026 development build · Device status and previews use demonstration data.' : '配图为 2026 年 10 月 2 日开发构建的中文原生界面；设备状态与预览画面为演示数据。','editorial-source-note'));
    const toc = $('<nav class="article-toc">');
    attribute(toc, 'aria-label', copy.tocTitle);
    toc.append(bind('h2', copy.tocTitle));
    const list = $('<ol>');
    for (const section of copy.sections) list.append($('<li>').append(bind('a', section.title).attr('href', `#${section.id}`)));
    toc.append(list); body.append(toc);
    for (const section of copy.sections) {
      const sectionNode = $('<section class="editorial-section">').attr('id',section.id);
      sectionNode.append(bind('h2', section.title)); body.append(sectionNode);
      for (const block of section.blocks) {
        if (block.type === 'p' || block.type === 'h3') sectionNode.append(bind(block.type, block.text));
        else if (block.type === 'ol' || block.type === 'ul') {
          const list = $(`<${block.type}>`);
          for (const item of block.items) list.append(bind('li', item));
          sectionNode.append(list);
        } else if (block.type === 'steps' || block.type === 'cards') {
          const items = $(`<${block.type === 'steps'?'ol':'div'}>`).addClass(block.type === 'steps'?'editorial-steps':'editorial-cards');
          for (const item of block.items) {
            const node = $(`<${block.type === 'steps'?'li':'div'}>`).append(bind('h3',item.title),bind('p',item.text));
            if (item.link === 'downloads') node.append(bind('a',language === 'en'?'Official downloads ↓':'官方下载入口 ↓').attr('href','#article-downloads'));
            items.append(node);
          }
          sectionNode.append(items);
        } else if (block.type === 'gallery') {
          const gallery = $('<div class="editorial-gallery">');
          block.images.forEach(id => gallery.append(figure(id))); sectionNode.append(gallery);
        } else if (block.type === 'figure') {
          // The wide control overview appears beside the opening conclusions.
          if (block.image !== 'ipad-controls') sectionNode.append(figure(block.image));
        } else if (block.type === 'callout') {
          sectionNode.append($('<aside class="article-highlight">').append(bind('strong',block.label),bind('p',block.text)));
        } else if (block.type === 'checks') {
          const checks = $('<div class="editorial-checks">');
          for (const item of block.items) {
            const list = $('<ul>'); item.items.forEach(text => list.append(bind('li',text)));
            checks.append($('<details>').append(bind('summary',item.question),list));
          }
          sectionNode.append(checks);
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
          table.append(rows); sectionNode.append($('<div class="article-table-scroll">').append(table));
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
    const image = $('<img>').attr({src:'/assets/editorial/mac-control/ipad-controls.webp',width:2752,height:2064,loading:'lazy',decoding:'async'});
    attribute(image,'alt',language === 'en' ? 'NinoPad Studio workspace on iPad; Chinese native interface with demonstration data' : 'iPad 上的 NinoPad 原生工作台，使用演示数据');
    featured.prepend($('<figure class="blog-featured-img">').append(image)).removeClass('blog-featured-text');
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
