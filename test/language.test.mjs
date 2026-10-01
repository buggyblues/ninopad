import { test } from 'node:test';
import assert from 'node:assert/strict';
import i18next from 'i18next';
import Detector from 'i18next-browser-languagedetector';
import { options, detection, crawlerLanguage } from '../src/language.js';
function resolve({query, saved, browser}) {
  const detector = new Detector();
  for (const [name,value] of [['querystring',query],['localStorage',saved],['navigator',browser]]) detector.addDetector({ name: "mock_"+name, lookup:()=>value });
  const i = i18next.createInstance();
  i.use(detector).init({ ...options,detection:{...detection,order:detection.order.map(n=>"mock_"+n)},resources:{ en:{translation:{hello:'Hello'}},'zh-CN':{translation:{hello:'你好'}} } });
  return i.resolvedLanguage;
}
test('browser regional English and simplified/traditional Chinese variants normalize',()=>{
  assert.equal(resolve({browser:['en-GB','zh-CN']}),'en');
  assert.equal(resolve({browser:['zh-TW','en-US']}),'zh-CN');
  assert.equal(resolve({browser:['zh-Hans-CN']}),'zh-CN');
});
test('explicit choice overrides remembered language and browser',()=>{
  assert.equal(resolve({query:'en',saved:'zh',browser:['zh-CN']}),'en');
  assert.equal(resolve({saved:'zh',browser:['en-US']}),'zh-CN');
});
test('unsupported language falls back to English and uses next supported preference',()=>{
  assert.equal(resolve({browser:['fr-FR']}),'en');
  assert.equal(resolve({browser:['de-DE','zh-CN']}),'zh-CN');
});
test('paths and HTML language never determine visitor language',()=>{
  assert.deepEqual(detection.order,['querystring','localStorage','navigator']);
  assert.deepEqual(detection.caches,[]);
});
test('search crawlers retain each prerendered language while browsers detect normally',()=>{
  assert.equal(crawlerLanguage('Mozilla/5.0 Safari/605.1.15','zh-CN'),undefined);
  assert.equal(crawlerLanguage('Googlebot/2.1','zh-CN'),'zh-CN');
  assert.equal(crawlerLanguage('OAI-SearchBot/1.0','en'),'en');
  assert.equal(crawlerLanguage('Bingbot/2.0','fr'),undefined);
});
