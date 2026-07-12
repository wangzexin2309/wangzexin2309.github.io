const USERNAME = "wangzexin2309";
const REPOS_PER_PAGE = 4;

const avatar = document.querySelector("#avatar");
const profileName = document.querySelector("#profile-name");
const repoCount = document.querySelector("#repo-count");
const followers = document.querySelector("#followers");
const following = document.querySelector("#following");
const mainLanguage = document.querySelector("#main-language");
const repoGrid = document.querySelector("#repo-grid");
const repoControls = document.querySelector("#repo-controls");

let allRepos = [];
let currentRepoPage = 1;

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;

  while (true) {
    const pageRepos = await fetchJson(`https://api.github.com/users/${USERNAME}/repos?per_page=100&page=${page}&sort=updated`);
    repos.push(...pageRepos);

    if (pageRepos.length < 100) {
      return repos;
    }

    page += 1;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}

function findMainLanguage(repos) {
  const counts = repos.reduce((acc, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "--";
}

function renderRepoControls() {
  const totalPages = Math.max(1, Math.ceil(allRepos.length / REPOS_PER_PAGE));

  if (allRepos.length <= REPOS_PER_PAGE) {
    repoControls.innerHTML = `<span class="page-status">${allRepos.length} repositories</span>`;
    return;
  }

  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const active = page === currentRepoPage ? " active" : "";
    return `<button class="page-button${active}" type="button" data-page="${page}" data-page-number="true" aria-label="Go to repository page ${page}">${page}</button>`;
  }).join("");

  repoControls.innerHTML = `
    <button class="page-button" type="button" data-page="${currentRepoPage - 1}" ${currentRepoPage === 1 ? "disabled" : ""}>Prev</button>
    ${pageButtons}
    <button class="page-button" type="button" data-page="${currentRepoPage + 1}" ${currentRepoPage === totalPages ? "disabled" : ""}>Next</button>
    <span class="page-status">${allRepos.length} repositories · page ${currentRepoPage}/${totalPages}</span>
  `;
}

function renderReposPage() {
  const start = (currentRepoPage - 1) * REPOS_PER_PAGE;
  const visibleRepos = allRepos.slice(start, start + REPOS_PER_PAGE);

  repoGrid.innerHTML = visibleRepos
    .map((repo) => {
      const description = repo.description || "Public GitHub repository.";
      const language = repo.language || "Code";
      return `
        <article class="repo-card">
          <h3><a href="${repo.html_url}">${escapeHtml(repo.name)}</a></h3>
          <p>${escapeHtml(description)}</p>
          <div class="repo-meta">
            <span>${escapeHtml(language)}</span>
            <span>${repo.stargazers_count} stars</span>
            <span>Updated ${formatDate(repo.updated_at)}</span>
          </div>
        </article>
      `;
    })
    .join("");

  renderRepoControls();
}

function setRepoPage(page) {
  const totalPages = Math.max(1, Math.ceil(allRepos.length / REPOS_PER_PAGE));
  currentRepoPage = Math.min(Math.max(page, 1), totalPages);
  renderReposPage();
}

function renderRepos(repos) {
  allRepos = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  if (allRepos.length === 0) {
    repoGrid.innerHTML = `<p class="loading">No public repositories found.</p>`;
    repoControls.innerHTML = "";
    return;
  }

  currentRepoPage = 1;
  renderReposPage();
}

function renderUnavailableState(error) {
  profileName.textContent = USERNAME;
  repoCount.textContent = "--";
  followers.textContent = "--";
  following.textContent = "--";
  mainLanguage.textContent = "--";
  repoGrid.innerHTML = `
    <article class="repo-card unavailable-card">
      <h3>GitHub data unavailable</h3>
      <p>The public GitHub API did not return live repository data right now. Open GitHub to view the current repository list.</p>
      <div class="repo-meta">
        <span>Live API failed</span>
        <span>${escapeHtml(error.message)}</span>
      </div>
    </article>
  `;
  repoControls.innerHTML = `<a class="page-button" href="https://github.com/${USERNAME}?tab=repositories">Open repositories</a>`;
}

async function loadGitHubData() {
  try {
    const [user, repos] = await Promise.all([
      fetchJson(`https://api.github.com/users/${USERNAME}`),
      fetchAllRepos()
    ]);

    avatar.src = user.avatar_url;
    avatar.alt = `${user.login} GitHub avatar`;
    profileName.textContent = user.login;
    repoCount.textContent = user.public_repos;
    followers.textContent = user.followers;
    following.textContent = user.following;
    mainLanguage.textContent = findMainLanguage(repos);
    renderRepos(repos);
  } catch (error) {
    renderUnavailableState(error);
  }
}

function startPixelBackground() {
  const canvas = document.querySelector("#pixel-bg");
  const context = canvas.getContext("2d");
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const stars = Array.from({ length: 92 }, (_, index) => ({
    x: Math.random(),
    y: Math.random() * 0.72,
    size: index % 5 === 0 ? 3 : 2,
    speed: 0.04 + Math.random() * 0.16,
    color: index % 4 === 0 ? "#78ffd6" : index % 3 === 0 ? "#00e5ff" : "#ffffff"
  }));

  function resize() {
    canvas.width = Math.floor(window.innerWidth * pixelRatio);
    canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawCity(width, height, time) {
    const base = Math.floor(height * 0.72);
    context.fillStyle = "rgba(15, 23, 42, 0.84)";
    context.fillRect(0, base, width, height - base);

    const buildingWidth = 58;
    for (let x = -20; x < width + buildingWidth; x += buildingWidth + 18) {
      const variant = Math.abs(Math.sin(x * 0.01)) * 90;
      const buildingHeight = 70 + variant;
      context.fillStyle = x % 3 === 0 ? "#111827" : "#172033";
      context.fillRect(x, base - buildingHeight, buildingWidth, buildingHeight);

      for (let y = base - buildingHeight + 18; y < base - 12; y += 24) {
        for (let wx = x + 12; wx < x + buildingWidth - 8; wx += 22) {
          const on = Math.sin(time * 0.002 + wx * 0.05 + y * 0.07) > 0.2;
          context.fillStyle = on ? "#00e5ff" : "rgba(0, 229, 255, 0.12)";
          context.fillRect(wx, y, 8, 8);
        }
      }
    }
  }

  function draw(time) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    context.clearRect(0, 0, width, height);

    stars.forEach((star) => {
      const x = ((star.x * width + time * star.speed) % (width + 30)) - 15;
      const y = star.y * height;
      context.fillStyle = star.color;
      context.fillRect(Math.floor(x), Math.floor(y), star.size, star.size);
    });

    drawCity(width, height, time);

    const horizon = Math.floor(height * 0.72);
    context.strokeStyle = "rgba(0, 229, 255, 0.35)";
    context.lineWidth = 1;
    for (let y = horizon; y < height; y += 28) {
      context.beginPath();
      context.moveTo(0, y + ((time * 0.018) % 28));
      context.lineTo(width, y + ((time * 0.018) % 28));
      context.stroke();
    }

    for (let x = -width; x < width * 2; x += 54) {
      const offset = (time * 0.026) % 54;
      context.beginPath();
      context.moveTo(width / 2, horizon);
      context.lineTo(x + offset, height);
      context.stroke();
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
}

repoControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");
  if (!button || button.disabled) {
    return;
  }

  setRepoPage(Number(button.dataset.page));
});

loadGitHubData();
startPixelBackground();
