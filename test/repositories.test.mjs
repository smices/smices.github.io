import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

test("repository data module exists", () => {
  assert.equal(existsSync(new URL("../assets/js/repositories.js", import.meta.url)), true);
});

test("repository data module exposes its public contract", async () => {
  const repositoryModule = await import("../assets/js/repositories.js");

  assert.equal(typeof repositoryModule.normalizeRepository, "function");
  assert.equal(typeof repositoryModule.selectRepositories, "function");
  assert.equal(typeof repositoryModule.filterRepositories, "function");
});

test("normalizeRepository keeps only the fields used by the page", async () => {
  const { normalizeRepository } = await import("../assets/js/repositories.js");
  const normalized = normalizeRepository({
    id: 42,
    name: "open-tool",
    html_url: "https://github.com/smices/open-tool",
    homepage: "javascript:alert(1)",
    description: "<strong>Useful</strong>",
    language: "TypeScript",
    stargazers_count: 7,
    forks_count: 3,
    fork: false,
    archived: false,
    pushed_at: "2026-07-30T01:02:03Z",
    topics: ["open-source", 7],
    owner: { login: "smices" },
    unexpected: "ignored"
  });

  assert.deepEqual(normalized, {
    id: 42,
    name: "open-tool",
    url: "https://github.com/smices/open-tool",
    homepage: "",
    description: "<strong>Useful</strong>",
    language: "TypeScript",
    stars: 7,
    forks: 3,
    isFork: false,
    isArchived: false,
    pushedAt: "2026-07-30T01:02:03Z",
    topics: ["open-source"],
    owner: "smices"
  });
});

test("selectRepositories filters non-projects and ranks featured work first", async () => {
  const { selectRepositories } = await import("../assets/js/repositories.js");
  const repositories = [
    { id: 1, name: "small", url: "https://github.com/smices/small", owner: "smices", stars: 1, pushedAt: "2026-07-01", isFork: false, isArchived: false, language: "Go", description: "", topics: [] },
    { id: 2, name: "open-idb", url: "https://github.com/smices/open-idb", owner: "smices", stars: 1, pushedAt: "2026-06-01", isFork: false, isArchived: false, language: "Go", description: "Identity infrastructure", topics: ["iam"] },
    { id: 3, name: "popular", url: "https://github.com/smices/popular", owner: "smices", stars: 9, pushedAt: "2026-05-01", isFork: false, isArchived: false, language: "C", description: "", topics: [] },
    { id: 4, name: "smices.github.io", url: "https://github.com/smices/smices.github.io", owner: "smices", stars: 20, pushedAt: "2026-07-30", isFork: false, isArchived: false, language: "CSS", description: "", topics: [] },
    { id: 5, name: "forked", url: "https://github.com/smices/forked", owner: "smices", stars: 30, pushedAt: "2026-07-30", isFork: true, isArchived: false, language: "Rust", description: "", topics: [] }
  ];

  const selected = selectRepositories(repositories, {
    featured: ["open-idb"],
    excluded: ["smices.github.io"]
  });

  assert.deepEqual(selected.map((repository) => repository.name), ["open-idb", "popular", "small"]);
});

test("filterRepositories searches text and narrows by language", async () => {
  const { filterRepositories } = await import("../assets/js/repositories.js");
  const repositories = [
    { name: "open-idb", description: "Enterprise identity infrastructure", language: "Go", topics: ["iam"] },
    { name: "open-avatar", description: "Deterministic avatars", language: "TypeScript", topics: ["svg"] },
    { name: "part-pilot", description: "AI CAD", language: "Python", topics: ["3d-printing"] }
  ];

  assert.deepEqual(
    filterRepositories(repositories, { query: "identity", language: "Go" }).map(({ name }) => name),
    ["open-idb"]
  );
  assert.deepEqual(
    filterRepositories(repositories, { query: "SVG", language: "all" }).map(({ name }) => name),
    ["open-avatar"]
  );
});
