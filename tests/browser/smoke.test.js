import { test, assertEq, openPage } from './harness.js';

test('korean page has lang ko', async () => {
  const { doc } = await openPage('/');
  assertEq(doc.documentElement.lang, 'ko');
});

test('english page has lang en', async () => {
  const { doc } = await openPage('/en/');
  assertEq(doc.documentElement.lang, 'en');
});

test('unknown path returns 404', async () => {
  const res = await fetch('/nope');
  assertEq(res.status, 404);
});
