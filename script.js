/* ==========================================================
   Zaid Fayaz Portfolio - script.js
   Edit the CONFIG block below to personalise the site.
   ========================================================== */
const CONFIG = {
  githubUsername: "YOUR_GITHUB_USERNAME", // <-- replace with your real GitHub username
  linkedin: "",   // e.g. "https://www.linkedin.com/in/your-name"  (leave "" to hide)
  email: "",      // e.g. "you@example.com"                        (leave "" to hide)
  instagram: "",  // e.g. "https://www.instagram.com/your-name"    (leave "" to hide)
  hideForks: true // set to false to also show forked repositories
};

document.documentElement.classList.add("js");

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const usernameIsSet = CONFIG.githubUsername && CONFIG.githubUsername !== "YOUR_GITHUB_USERNAME";
const githubProfileUrl = `https://github.com/${CONFIG.githubUsername}`;

/* ---------- Toast ---------- */
const toastEl = $("#toast");
let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3500);
}

/* ---------- Mobile navigation ---------- */
const navToggle = $("#navToggle");
const navLinks = $("#navLinks");

function setMenu(open) {
  navLinks.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
}
navToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
$$(".nav-link").forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

/* ---------- Navbar style, back-to-top ---------- */
const navbar = $("#navbar");
const backTop = $("#backTop");

function onScroll() {
  navbar.classList.toggle("scrolled", window.scrollY > 30);
  backTop.hidden = window.scrollY < 500;
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

backTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});

/* ---------- Active nav link ---------- */
const sections = $$("main section[id]");
const navMap = new Map($$(".nav-link").map((a) => [a.getAttribute("href").slice(1), a]));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navMap.forEach((a) => a.classList.remove("active"));
      const active = navMap.get(entry.target.id);
      if (active) active.classList.add("active");
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => sectionObserver.observe(s));

/* ---------- Scroll reveal ---------- */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function observeReveals(root = document) {
  $$(".reveal:not(.visible)", root).forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
    revealObserver.observe(el);
  });
}
observeReveals();

/* ---------- Typed text animation ---------- */
const typedEl = $("#typedText");
const phrases = ["Learning Git & GitHub", "Exploring AI tools", "Building projects", "Growing as a developer"];

function startTyping() {
  if (prefersReducedMotion) { typedEl.textContent = phrases[0]; return; }
  let phraseIndex = 0, charIndex = 0, deleting = false;
  (function tick() {
    const phrase = phrases[phraseIndex];
    charIndex += deleting ? -1 : 1;
    typedEl.textContent = phrase.slice(0, charIndex);
    let delay = deleting ? 40 : 85;
    if (!deleting && charIndex === phrase.length) { deleting = true; delay = 1600; }
    else if (deleting && charIndex === 0) { deleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; delay = 400; }
    setTimeout(tick, delay);
  })();
}
startTyping();

/* ---------- Profile photo fallback ---------- */
const photo = $("#profilePhoto");
const photoFallback = $("#photoFallback");
function showPhotoFallback() { photo.hidden = true; photoFallback.hidden = false; }
photo.addEventListener("error", showPhotoFallback);
if (photo.complete && photo.naturalWidth === 0) showPhotoFallback();

/* ---------- CV button ---------- */
$("#cvBtn").addEventListener("click", async (e) => {
  if (location.protocol === "file:") return; // can't check files when opened locally
  e.preventDefault();
  const link = e.currentTarget;
  try {
    const res = await fetch(link.getAttribute("href"), { method: "HEAD" });
    if (!res.ok) throw new Error("missing");
    const a = document.createElement("a");
    a.href = link.href;
    a.download = "";
    a.click();
  } catch {
    showToast("CV not added yet. Place Zaid-Fayaz-CV.pdf in the project folder.");
  }
});

/* ---------- Contact links & footer year ---------- */
$("#year").textContent = new Date().getFullYear();

function setupContactLinks() {
  const gh = $("#githubLink");
  const footerGh = $("#footerGithub");
  if (usernameIsSet) {
    gh.href = githubProfileUrl;
    $("#githubLinkText").textContent = `github.com/${CONFIG.githubUsername}`;
    footerGh.href = githubProfileUrl;
  } else {
    gh.href = "https://github.com";
    $("#githubLinkText").textContent = "Add your username in script.js";
    footerGh.href = "https://github.com";
  }

  if (CONFIG.linkedin) { const el = $("#linkedinLink"); el.href = CONFIG.linkedin; el.hidden = false; }
  if (CONFIG.instagram) { const el = $("#instagramLink"); el.href = CONFIG.instagram; el.hidden = false; }
  if (CONFIG.email) {
    const el = $("#emailLink");
    el.href = `mailto:${CONFIG.email}`;
    $("#emailLinkText").textContent = CONFIG.email;
    el.hidden = false;
  }
  $("#allProjectsBtn").href = usernameIsSet ? `${githubProfileUrl}?tab=repositories` : "https://github.com";
}
setupContactLinks();

/* ---------- GitHub projects ---------- */
const grid = $("#projectsGrid");
const stateEl = $("#projectsState");
const filtersEl = $("#filters");
let allRepos = [];
let activeFilter = "All";

const escapeHTML = (str = "") =>
  str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function setState(html) { stateEl.innerHTML = html; }

function showLoading() {
  grid.innerHTML = "";
  filtersEl.hidden = true;
  setState('<div class="state-box"><div class="spinner" aria-hidden="true"></div>Loading repositories from GitHub...</div>');
}

function showMessage(title, text) {
  grid.innerHTML = "";
  filtersEl.hidden = true;
  setState(`<div class="state-box"><strong>${title}</strong>${text}</div>`);
}

function safeHomepage(url) {
  if (!url) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return ["http:", "https:"].includes(u.protocol) ? u.href : "";
  } catch { return ""; }
}

function renderFilters() {
  const languages = [...new Set(allRepos.map((r) => r.language).filter(Boolean))].sort();
  if (languages.length < 2) { filtersEl.hidden = true; return; }
  filtersEl.innerHTML = ["All", ...languages]
    .map((l) => `<button type="button" class="filter-btn${l === activeFilter ? " active" : ""}" data-lang="${escapeHTML(l)}">${escapeHTML(l)}</button>`)
    .join("");
  filtersEl.hidden = false;
}

filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  activeFilter = btn.dataset.lang;
  $$(".filter-btn", filtersEl).forEach((b) => b.classList.toggle("active", b === btn));
  renderProjects();
});

function renderProjects() {
  const repos = activeFilter === "All" ? allRepos : allRepos.filter((r) => r.language === activeFilter);
  setState("");
  grid.innerHTML = repos.map((repo, i) => {
    const live = safeHomepage(repo.homepage);
    const desc = repo.description ? escapeHTML(repo.description) : "No description provided for this repository.";
    return `
      <article class="glass card project-card" style="animation-delay:${Math.min(i, 8) * 60}ms">
        <h3>${escapeHTML(repo.name)}</h3>
        <p class="project-desc">${desc}</p>
        <div class="project-meta">
          ${repo.language ? `<span class="tag">${escapeHTML(repo.language)}</span>` : ""}
          <span>Updated ${formatDate(repo.updated_at)}</span>
        </div>
        <div class="project-actions">
          <a class="btn btn-primary" href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer">View on GitHub</a>
          ${live ? `<a class="btn btn-outline" href="${escapeHTML(live)}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ""}
        </div>
      </article>`;
  }).join("");
}

async function loadRepos() {
  if (!usernameIsSet) {
    showMessage(
      "GitHub username not set yet",
      "Open <code>script.js</code> and replace <code>YOUR_GITHUB_USERNAME</code> with your GitHub username to show your projects here."
    );
    return;
  }

  showLoading();
  try {
    const url = `https://api.github.com/users/${encodeURIComponent(CONFIG.githubUsername)}/repos?sort=updated&per_page=100`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (res.status === 404) throw new Error("not-found");
    if (res.status === 403) throw new Error("rate-limit");
    if (!res.ok) throw new Error("http");

    const data = await res.json();
    allRepos = data.filter((r) => !(CONFIG.hideForks && r.fork));

    if (allRepos.length === 0) {
      showMessage(
        "No public repositories yet",
        `Projects will appear here as soon as you publish a public repository on <a href="${githubProfileUrl}" target="_blank" rel="noopener noreferrer">GitHub</a>.`
      );
      return;
    }
    renderFilters();
    renderProjects();
  } catch (err) {
    const reasons = {
      "not-found": "That GitHub username could not be found. Please check the spelling in script.js.",
      "rate-limit": "GitHub's request limit was reached. Please try again in a little while."
    };
    showMessage(
      "Couldn't load projects right now",
      `${reasons[err.message] || "GitHub may be unavailable or you may be offline."} You can still browse everything directly on <a href="${githubProfileUrl}" target="_blank" rel="noopener noreferrer">my GitHub profile</a>.`
    );
  }
}
loadRepos();

/* ---------- Contact form validation ---------- */
const form = $("#contactForm");
const formStatus = $("#formStatus");

const rules = {
  name: (v) => (v.trim().length >= 2 ? "" : "Please enter your name (at least 2 characters)."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email address."),
  subject: (v) => (v.trim().length >= 3 ? "" : "Please enter a subject (at least 3 characters)."),
  message: (v) => (v.trim().length >= 10 ? "" : "Your message should be at least 10 characters.")
};

function validateField(name) {
  const input = form.elements[name];
  const message = rules[name](input.value);
  input.closest(".field").classList.toggle("invalid", Boolean(message));
  input.setAttribute("aria-invalid", String(Boolean(message)));
  $(`.error[data-for="${name}"]`, form).textContent = message;
  return !message;
}

Object.keys(rules).forEach((name) => {
  form.elements[name].addEventListener("blur", () => validateField(name));
  form.elements[name].addEventListener("input", () => {
    if (form.elements[name].closest(".field").classList.contains("invalid")) validateField(name);
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  formStatus.className = "form-status";
  const valid = Object.keys(rules).map(validateField).every(Boolean);
  if (!valid) {
    formStatus.textContent = "Please fix the highlighted fields.";
    const firstBad = $(".field.invalid input, .field.invalid textarea", form);
    if (firstBad) firstBad.focus();
    return;
  }

  /* No backend is connected, so nothing is actually sent.
     To make it work, connect a service such as Formspree or EmailJS here. */
  formStatus.classList.add("ok");
  formStatus.textContent = CONFIG.email
    ? "Your details look good, but this form isn't connected to an email service yet. Please email me directly using the link above."
    : "Your details look good, but this form isn't connected to an email service yet, so the message was not sent.";
});