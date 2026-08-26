#!/usr/bin/env node

/**
 * Download the public 3X-UI Postman collection and render a route-by-route
 * cURL reference. Run with: node scripts/extract-postman-api-reference.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const sourceUrl = 'https://documenter.gw.postman.com/api/collections/5146551/2sBXwnsBko?segregateAuth=true&versionTag=latest';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = resolve(root, 'docs');
const examplesPath = resolve(docsDir, '3x-ui-panel-api-curl-examples.md');

const response = await fetch(sourceUrl);
if (!response.ok) throw new Error(`Postman collection request failed: ${response.status} ${response.statusText}`);

// Only the rendered cURL examples are persisted - the raw collection JSON
// (~700KB-1MB) isn't checked in; re-run this script to refresh from source
// instead of committing a stale snapshot of it.
const collection = await response.json();
await mkdir(docsDir, { recursive: true });

const htmlToText = (value = '') => value
  .replace(/<br\s*\/?>(\r?\n)?/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/&#x3D;/g, '=')
  .replace(/\s+/g, ' ')
  .trim();

const quote = (value) => `'${String(value).replaceAll("'", "'\\\"'\\\"'")}'`;
const route = (request) => {
  const raw = typeof request.url === 'string' ? request.url : request.url?.raw ?? '';
  return raw.replace(/^\/+/, '/').replace(/^\{\{baseUrl\}\}/, '');
};

const curl = (request) => {
  const parts = [`curl --request ${request.method}`, `--url "$BASE_URL${route(request)}"`];
  const headers = (request.header ?? []).filter(({ disabled, key }) => !disabled && key && !/^(host|content-length|cookie|authorization)$/i.test(key));

  for (const { key, value = '' } of headers) parts.push(`--header ${quote(`${key}: ${value}`)}`);
  if (route(request).startsWith('/panel/api/')) parts.push('--header "Authorization: Bearer $API_TOKEN"');

  const body = request.body;
  if (body?.mode === 'raw' && body.raw) parts.push(`--data-raw ${quote(body.raw)}`);
  if (body?.mode === 'urlencoded') {
    for (const field of body.urlencoded ?? []) if (!field.disabled) parts.push(`--data-urlencode ${quote(`${field.key}=${field.value ?? ''}`)}`);
  }
  if (body?.mode === 'formdata') {
    for (const field of body.formdata ?? []) if (!field.disabled) {
      const value = field.type === 'file' ? `@/path/to/${field.value || field.key}` : field.value ?? '';
      parts.push(`--form ${quote(`${field.key}=${value}`)}`);
    }
  }

  return parts.join(String.raw` \
  `);

};

const renderItems = (items, headings = []) => items.flatMap((item) => {
  if (item.item) return renderItems(item.item, [...headings, item.name]);
  if (!item.request) return [];
  const title = [...headings, item.name].join(' — ');
  const description = htmlToText(item.request.description || item.description);
  return [
    `## ${item.request.method} \`${route(item.request)}\``,
    '',
    `**${title}**${description ? ` — ${description}` : ''}`,
    '',
    '```sh',
    curl(item.request),
    '```',
    '',
  ];
});

const generatedAt = new Date().toISOString().slice(0, 10);
const markdown = [
  '# 3X-UI Panel API — cURL examples',
  '',
  `Generated from the [published Postman collection](https://documenter.getpostman.com/view/5146551/2sBXwnsBko) on ${generatedAt}.`,
  '',
  'Set `BASE_URL` to the panel origin (for example, `https://panel.example.com`) and `API_TOKEN` to an API token before running protected examples. Login, logout, and CSRF endpoints are intentionally shown without an automatic Bearer header.',
  '',
  '```sh',
  'export BASE_URL="https://panel.example.com"',
  'export API_TOKEN="replace-with-an-api-token"',
  '```',
  '',
  ...renderItems(collection.item),
].join('\n');

await writeFile(examplesPath, markdown);
console.log(`Wrote ${examplesPath}`);
