import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { readFileSync } from 'node:fs';
import { applyEditorialContent } from '../scripts/editorial-content.mjs';

test('the complete guide has working section links, separate permissions and matching FAQ data', () => {
  let shape;
  for (const language of ['zh-CN', 'en']) {
    const $ = load(readFileSync('src/pages/blog/remote-control-mac.html', 'utf8'));
    const values = {};
    applyEditorialContent($, 'blog_remote-control-mac', language, values);
    assert.equal($('.article-cover').length, 0);
    assert.equal($('.article-body img').length, 3);
    assert.equal($('.article-toc a').length, 5);
    for (const node of $('.article-toc a').toArray()) assert.equal($($(node).attr('href')).length, 1);
    assert.equal($('.article-table').length, 1);
    assert.equal($('.editorial-steps li').length, 4);
    assert.equal($('.editorial-checks details').length, 6);
    assert.equal($('article > .editorial-section').first().attr('id'), 'pair');
    assert.equal($('article > p').first().attr('class'), 'article-lead');
    assert.equal($('.editorial-overview img').length,1);
    assert.equal($('.editorial-answer li').length,3);
    assert.equal($('#questions details').length, 4);
    assert.equal($('.article-related a').length, 3);
    assert($('article').text().includes('macOS 13'));
    assert($('article').text().includes('iPadOS 17'));
    const structure = $('article *').toArray().map(node => node.name + ':' + ($(node).attr('id') || '')).join('\n');
    if (shape) assert.equal(structure, shape); else shape = structure;
  }
});

test('promoting the complete guide keeps the former featured guide discoverable', () => {
  const $ = load(readFileSync('src/pages/blog.html', 'utf8'));
  applyEditorialContent($, 'blog', 'en', {});
  assert.equal($('.blog-featured').attr('href'), '/blog/remote-control-mac');
  assert.equal($('.blog-featured').attr('data-blog-cat'), 'settings');
  assert.equal($('.blog-grid a[href="/blog/layout-work"]').length, 1);
  assert.equal($('main a[href="/blog/remote-control-mac"]').length, 1);
});
