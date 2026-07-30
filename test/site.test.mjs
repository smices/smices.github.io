import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("site exposes an accessible dynamic project browser", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");

  assert.match(html, /<main/);
  assert.match(html, /id="project-search"/);
  assert.match(html, /id="language-filter"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /type="module" src="assets\/js\/app\.js"/);
});

test("site supports light and dark color themes", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("stylesheets/stylesheet.css", root), "utf8")
  ]);

  assert.match(html, /id="theme-toggle"/);
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /\[data-theme="light"\]/);
});
