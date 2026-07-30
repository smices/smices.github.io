import {
  filterRepositories,
  normalizeRepository,
  selectRepositories
} from "./repositories.js";

const USERNAME = "smices";
const FEATURED = ["open-idb", "part-pilot", "cargo_fit_3d", "open-avatar", "free-sales-forecast", "php-ext-templix"];
const LANGUAGE_COLORS = {
  C: "#7f8cff",
  "C++": "#f05a9d",
  CSS: "#a06bff",
  Go: "#28c9dd",
  Java: "#f39b5f",
  JavaScript: "#f4d35e",
  Nim: "#ffe953",
  PHP: "#8d8cbd",
  Python: "#4c9be8",
  Rust: "#e68a54",
  TypeScript: "#4f86f7"
};

const elements = {
  avatar: document.querySelector("#profile-avatar"),
  grid: document.querySelector("#project-grid"),
  language: document.querySelector("#language-filter"),
  repoCount: document.querySelector("#repo-count"),
  resultStatus: document.querySelector("#result-status"),
  search: document.querySelector("#project-search"),
  starCount: document.querySelector("#star-count"),
  syncStatus: document.querySelector("#sync-status"),
  themeToggle: document.querySelector("#theme-toggle"),
  year: document.querySelector("#current-year")
};

let repositories = [];

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知时间";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
};

const createTextElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
};

const renderCard = (repository, index) => {
  const card = document.createElement("article");
  card.className = `project-card${FEATURED.includes(repository.name) ? " featured" : ""}`;

  const topline = createTextElement("div", "card-topline", "");
  const type = createTextElement(
    "span",
    FEATURED.includes(repository.name) ? "featured-label" : "",
    FEATURED.includes(repository.name) ? "FEATURED PROJECT" : `PROJECT ${String(index + 1).padStart(2, "0")}`
  );
  const arrow = createTextElement("span", "", "↗");
  topline.append(type, arrow);

  const heading = document.createElement("h3");
  const link = document.createElement("a");
  link.href = repository.url;
  link.textContent = repository.name;
  link.setAttribute("aria-label", `在 GitHub 查看 ${repository.name}`);
  heading.append(link);

  const description = createTextElement(
    "p",
    "project-description",
    repository.description || "正在探索中的开源项目，欢迎查看源码与最新进展。"
  );

  const metadata = createTextElement("div", "project-meta", "");
  if (repository.language) {
    const language = createTextElement("span", "language", repository.language);
    language.style.setProperty("--language-color", LANGUAGE_COLORS[repository.language] || "#5b8cff");
    metadata.append(language);
  }
  metadata.append(
    createTextElement("span", "", `★ ${repository.stars}`),
    createTextElement("span", "", `⑂ ${repository.forks}`),
    createTextElement("span", "", `更新于 ${formatDate(repository.pushedAt)}`)
  );

  card.append(topline, heading, description, metadata);

  if (repository.topics.length) {
    const topics = createTextElement("div", "project-topics", "");
    repository.topics.slice(0, 3).forEach((topic) => topics.append(createTextElement("span", "", topic)));
    card.append(topics);
  }

  return card;
};

const renderProjects = () => {
  const visible = filterRepositories(repositories, {
    query: elements.search.value,
    language: elements.language.value
  });

  elements.grid.replaceChildren();
  elements.grid.setAttribute("aria-busy", "false");
  elements.resultStatus.textContent = `显示 ${visible.length} / ${repositories.length} 个项目`;

  if (!visible.length) {
    const empty = createTextElement("div", "empty-state", "没有找到匹配的项目，试试其他关键词或语言。");
    elements.grid.append(empty);
    return;
  }

  visible.forEach((repository, index) => elements.grid.append(renderCard(repository, index)));
};

const populateLanguages = () => {
  const languages = [...new Set(repositories.map(({ language }) => language).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
  languages.forEach((language) => {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = language;
    elements.language.append(option);
  });
};

const loadGitHubData = async () => {
  const response = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error("GitHub API returned an unexpected response");

  repositories = selectRepositories(
    payload.map(normalizeRepository),
    { featured: FEATURED, excluded: [`${USERNAME}.github.io`] }
  );
  populateLanguages();
  renderProjects();

  elements.repoCount.textContent = String(repositories.length);
  elements.starCount.textContent = String(repositories.reduce((total, repository) => total + repository.stars, 0));
  elements.syncStatus.textContent = `已同步 · ${new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
};

elements.search.addEventListener("input", renderProjects);
elements.language.addEventListener("change", renderProjects);
elements.themeToggle.addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("missu-theme", theme);
  } catch {}
});

elements.year.textContent = String(new Date().getFullYear());

loadGitHubData().catch(() => {
  elements.grid.setAttribute("aria-busy", "false");
  elements.grid.replaceChildren();
  const message = createTextElement("div", "empty-state", "暂时无法连接 GitHub。");
  const link = document.createElement("a");
  link.href = `https://github.com/${USERNAME}?tab=repositories`;
  link.textContent = "直接查看 GitHub 项目 →";
  message.append(document.createElement("br"), link);
  elements.grid.append(message);
  elements.resultStatus.textContent = "动态数据暂时不可用";
  elements.syncStatus.textContent = "等待重新连接";
});
