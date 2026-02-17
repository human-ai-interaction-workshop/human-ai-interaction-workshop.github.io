async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function avatarSVG(size) {
  const cls = size === "lg" ? "avatar avatar-lg" : "avatar";
  return `
    <div class="${cls}" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z" stroke="currentColor" stroke-width="1.6"/>
        <path d="M4.5 20c1.8-4 13.2-4 15 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </div>
  `;
}

function headshot(imageUrl, name, size) {
  if (imageUrl) {
    const cls = size === "lg" ? "headshot headshot-lg" : "headshot";
    return `<img class="${cls}" src="${escapeHTML(imageUrl)}" alt="${escapeHTML(name)}" />`;
  }
  return avatarSVG(size);
}

function tagHTML(status, invitedAsterisk) {
  if (status === "confirmed") return `<span class="tag confirmed">Confirmed</span>`;
  if (status === "invited") return `<span class="tag invited">Invited</span>`;
  // fallback
  return `<span class="tag invited">${escapeHTML(status || (invitedAsterisk ? "Invited" : "TBD"))}</span>`;
}

function rowClass(type) {
  if (!type) return "";
  return `rowtype-${type}`;
}

async function renderSite() {
  const site = await loadJSON("assets/data/site.json");

  // Brand / hero copy
  document.title = site.meta?.title || document.title;
  const navBrand = document.getElementById("navBrand");
  if (navBrand && site.navBrand) navBrand.textContent = site.navBrand;

  const heroKicker = document.getElementById("heroKicker");
  if (heroKicker && site.hero?.kicker) heroKicker.textContent = site.hero.kicker;

  const heroTitle = document.getElementById("heroTitle");
  if (heroTitle && site.hero?.titleHTML) heroTitle.innerHTML = site.hero.titleHTML;

  const heroLead = document.getElementById("heroLead");
  if (heroLead && site.hero?.lead) heroLead.textContent = site.hero.lead;

  // Pills
  const heroPills = document.getElementById("heroPills");
  if (heroPills && Array.isArray(site.hero?.pills)) {
    heroPills.innerHTML = site.hero.pills.map(p => `<span class="pill">${escapeHTML(p)}</span>`).join("");
  }

  // About text + cards
  const aboutText = document.getElementById("aboutText");
  if (aboutText && site.about?.text) aboutText.textContent = site.about.text;

  const aboutCards = document.getElementById("aboutCards");
  if (aboutCards && Array.isArray(site.about?.cards)) {
    aboutCards.innerHTML = site.about.cards.map(c => `
      <div class="col-md-6 col-lg-4">
        <div class="soft-card p-4 h-100">
          <div class="about-card-title mb-2">${escapeHTML(c.title)}</div>
          <div class="tiny mb-0">${escapeHTML(c.body)}</div>
        </div>
      </div>
    `).join("");
  }

  // Footer
  const footerLeft = document.getElementById("footerLeft");
  if (footerLeft && site.footer?.left) footerLeft.textContent = site.footer.left;
}

async function renderSpeakers() {
  const data = await loadJSON("assets/data/speakers.json");
  const grid = document.getElementById("speakersGrid");
  if (!grid) return;

  grid.innerHTML = data.speakers.map(s => {
    const status = s.status || "invited";
    const asterisk = (status === "invited") ? "<span class='fw-bold'>*</span>" : "";
    const linkOpen = s.url ? `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">` : "";
    const linkClose = s.url ? `</a>` : "";

    return `
      <div class="col-lg-6">
        <div class="soft-card p-4 speaker-card">
          <div class="d-flex gap-3">
            ${headshot(s.image, s.name, "lg")}
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <div class="speaker-name">
                  ${linkOpen}${escapeHTML(s.name)}${asterisk}${linkClose}
                </div>
                ${tagHTML(status)}
              </div>
              ${s.title ? `<p class="speaker-title">${escapeHTML(s.title)}</p>` : ""}
              <p class="speaker-affil">${escapeHTML(s.affiliation || "")}</p>
              ${s.topic ? `<p class="tiny mb-0">${escapeHTML(s.topic)}</p>` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function renderSchedule() {
  const data = await loadJSON("assets/data/schedule.json");
  const note = document.getElementById("scheduleNote");
  const body = document.getElementById("scheduleBody");
  const foot = document.getElementById("scheduleFootnote");

  if (note && data.note) note.textContent = data.note;
  if (!body) return;

  body.innerHTML = data.items.map(it => `
    <tr class="${rowClass(it.type)}">
      <td>${escapeHTML(it.time)}</td>
      <td>${escapeHTML(it.session)}</td>
      <td>${escapeHTML(it.details)}</td>
    </tr>
  `).join("");

  if (foot) foot.innerHTML = escapeHTML(data.footnote || "");
}


async function renderOrganizers() {
  const data = await loadJSON("assets/data/organizers.json");
  const grid = document.getElementById("organizersGrid");
  if (!grid) return;

  grid.innerHTML = data.organizers.map(o => {
    const open = o.url ? `<a href="${escapeHTML(o.url)}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">` : "";
    const close = o.url ? `</a>` : "";
    return `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="soft-card p-4 h-100 person-card">
          ${headshot(o.image, o.name, "lg")}
          <div class="speaker-name mt-3">${open}${escapeHTML(o.name)}${close}</div>
          <div class="tiny">${escapeHTML(o.affiliation || "")}</div>
        </div>
      </div>
    `;
  }).join("");
}

async function renderAdvisory() {
  const data = await loadJSON("assets/data/advisory.json");
  const grid = document.getElementById("advisoryGrid");
  if (!grid) return;

  grid.innerHTML = data.advisory.map(a => {
    const open = a.url ? `<a href="${escapeHTML(a.url)}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">` : "";
    const close = a.url ? `</a>` : "";
    return `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="soft-card p-4 h-100 person-card">
          ${headshot(a.image, a.name, "lg")}
          <div class="speaker-name mt-3">${open}${escapeHTML(a.name)}${close}</div>
          <div class="tiny">${escapeHTML(a.affiliation || "")}</div>
        </div>
      </div>
    `;
  }).join("");
}

(async function main() {
  try {
    await renderSite();
    await Promise.all([renderSpeakers(), renderSchedule(), renderOrganizers(), renderAdvisory()]);
  } catch (e) {
    console.error(e);
  }
})();
