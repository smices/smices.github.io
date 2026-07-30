export function normalizeRepository(repository) {
  const safeUrl = (value) => {
    if (typeof value !== "string" || value.length === 0) return "";

    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };

  return {
    id: Number.isSafeInteger(repository?.id) ? repository.id : 0,
    name: typeof repository?.name === "string" ? repository.name : "",
    url: safeUrl(repository?.html_url),
    homepage: safeUrl(repository?.homepage),
    description: typeof repository?.description === "string" ? repository.description : "",
    language: typeof repository?.language === "string" ? repository.language : "",
    stars: Number.isFinite(repository?.stargazers_count) ? repository.stargazers_count : 0,
    forks: Number.isFinite(repository?.forks_count) ? repository.forks_count : 0,
    isFork: repository?.fork === true,
    isArchived: repository?.archived === true,
    pushedAt: typeof repository?.pushed_at === "string" ? repository.pushed_at : "",
    topics: Array.isArray(repository?.topics)
      ? repository.topics.filter((topic) => typeof topic === "string")
      : [],
    owner: typeof repository?.owner?.login === "string" ? repository.owner.login : ""
  };
}

export function selectRepositories(repositories, options = {}) {
  const featured = new Map((options.featured ?? []).map((name, index) => [name, index]));
  const excluded = new Set(options.excluded ?? []);

  return repositories
    .filter((repository) =>
      repository
      && repository.owner === "smices"
      && repository.url
      && !repository.isFork
      && !repository.isArchived
      && !excluded.has(repository.name))
    .sort((left, right) => {
      const leftRank = featured.get(left.name);
      const rightRank = featured.get(right.name);

      if (leftRank !== undefined || rightRank !== undefined) {
        if (leftRank === undefined) return 1;
        if (rightRank === undefined) return -1;
        return leftRank - rightRank;
      }

      return right.stars - left.stars
        || Date.parse(right.pushedAt || 0) - Date.parse(left.pushedAt || 0)
        || left.name.localeCompare(right.name);
    });
}

export function filterRepositories(repositories, filters = {}) {
  const query = String(filters.query ?? "").trim().toLocaleLowerCase();
  const language = filters.language ?? "all";

  return repositories.filter((repository) => {
    const matchesLanguage = language === "all" || repository.language === language;
    const searchableText = [
      repository.name,
      repository.description,
      ...(repository.topics ?? [])
    ].join(" ").toLocaleLowerCase();

    return matchesLanguage && (!query || searchableText.includes(query));
  });
}
