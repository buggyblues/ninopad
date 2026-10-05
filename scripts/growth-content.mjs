export function addGrowthContent($, page, language, catalog) {
  function text(tag, key, className) {
    return $(`<${tag}>`).text(catalog[key]).attr('data-i18n-text', JSON.stringify({0:key})).addClass(className || '');
  }
  function link(href, key) { return text('a',key).attr('href',href); }
  const store = 'https://apps.apple.com/app/id6805378609';
  const mac = 'https://github.com/buggyblues/ninopad/releases/latest';
  if (page === 'index') {
    $('.hero-copy h1').after(text('p','index.growth_intro','hero-product-intro'));
    const section = $('<section class="search-guides" id="guides">');
    section.append(text('h2','index.growth_heading'));
    section.append(text('p','index.growth_summary'));
    const cards = $('<div class="search-guide-grid">');
    for (const [slug,key] of [['remote-control-mac','remote'],['custom-keypad','macros'],['presentation-tools','slides'],['mac-settings','setup']]) {
      const card = $('<a class="search-guide-card">').attr('href','/blog/'+slug);
      card.append(text('h3',`index.growth_${key}_title`), text('p',`index.growth_${key}_body`));
      cards.append(card);
    }
    section.append(cards); $('#layouts').after(section);
  }
  if (page.startsWith('blog_')) {
    const breadcrumbs = $('<nav class="breadcrumbs">').attr('aria-label',catalog['ui.breadcrumbs']).attr('data-i18n-attrs',JSON.stringify({'aria-label':'ui.breadcrumbs'}));
    const list = $('<ol>');
    list.append($('<li>').append(link('/','ui.home')), $('<li>').append(link('/blog','ui.guides')));
    list.append($('<li aria-current="page">').append(text('span', `${page}.growth_breadcrumb`)));
    breadcrumbs.append(list); $('.article-header').prepend(breadcrumbs);
    const cta = $('<aside class="article-download-cta" data-cta-placement="article">');
    cta.append(text('h2','ui.article_download_title'),text('p','ui.article_download_body'));
    const actions = $('<div class="article-download-actions">');
    actions.append(link(store,'ui.get_ios'),link(mac,'ui.get_mac').attr('data-release-link',''));
    cta.append(actions,link('/blog/mac-settings','ui.setup_guide'));
    $('main').append(cta);
    if (page === 'blog_custom-keypad') {
      const faq = $('<section class="article-search-faq">');
      faq.append(text('h2','ui.quick_answers'));
      for (const key of ['network','requirements','free']) {
        const details = $('<details>');
        details.append(text('summary',`ui.answer_${key}_question`),text('p',`ui.answer_${key}_body`));
        faq.append(details);
      }
      $('.article-download-cta').before(faq);
    }
  }
  if (page === 'privacy') {
    const section = $('<section id="website-analytics">');
    section.append(text('h2','privacy.growth_analytics_title'), text('p','privacy.growth_analytics_body'),text('p','privacy.growth_analytics_controls'));
    $('.legal-back').before(section);
  }
  const settings = text('button','ui.analytics_settings','analytics-settings').attr({type:'button','data-analytics-settings':'',hidden:''});
  if ($('footer').length) $('footer').append(settings); else $('main').append(settings);
  const banner = $('<aside class="analytics-consent" data-analytics-consent hidden role="region">')
    .attr('aria-label',catalog['ui.analytics_title']).attr('data-i18n-attrs',JSON.stringify({'aria-label':'ui.analytics_title'}));
  banner.append(text('p','ui.analytics_body'));
  const buttons = $('<div class="analytics-consent-actions">');
  buttons.append(text('button','ui.analytics_accept').attr({type:'button','data-consent-accept':''}),
    text('button','ui.analytics_reject').attr({type:'button','data-consent-reject':''}),link('/privacy#website-analytics','ui.analytics_privacy'));
  banner.append(buttons); $('body').append(banner);
}
