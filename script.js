const API_URL =
  "https://countries.dev/countries?fields=name,flags,flag,population,capital,region,area,borders,currencies,languages,alpha3Code";

const COUNTRIES_PER_LOAD = 20;
const FAVORITES_KEY = "world_explorer_favorites";
const THEME_KEY = "world_explorer_theme";

// DOM ELEMENTS
const exploreView = document.getElementById("exploreView");
const favoritesSection = document.getElementById("favoritesSection");
const countryContainer = document.getElementById("countryContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const noFavoritesMsg = document.getElementById("noFavoritesMsg");

const searchInput = document.getElementById("searchInput");
const regionFilter = document.getElementById("regionFilter");
const sortSelect = document.getElementById("sortSelect");
const countryCount = document.getElementById("countryCount");
const loadMoreBtn = document.getElementById("loadMoreBtn");

const loading = document.getElementById("loading");
const error = document.getElementById("error");
const errorMessage = document.getElementById("errorMessage");
const empty = document.getElementById("empty");

const refreshBtn = document.getElementById("refreshBtn");
const retryBtn = document.getElementById("retryBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");

const logoLink = document.getElementById("logoLink");
const exploreLink = document.getElementById("exploreLink");
const favoritesLink = document.getElementById("favoritesLink");
const backToExploreBtn = document.getElementById("backToExploreBtn");
const favCount = document.getElementById("favCount");

const detailModal = document.getElementById("detailModal");
const modalContent = document.getElementById("modalContent");
const closeModalBtn = document.getElementById("closeModalBtn");

const compareSelect1 = document.getElementById("compareSelect1");
const compareSelect2 = document.getElementById("compareSelect2");
const compareResult = document.getElementById("compareResult");

// APPLICATION STATE
let allCountries = [];
let currentFilteredCountries = [];
let visibleCount = COUNTRIES_PER_LOAD;
let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
let currentRequestId = 0;
let debounceTimer = null;

// DARK MODE / LIGHT MODE (LOCAL STORAGE)
function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    themeToggleBtn.textContent = "☀️ Light";
  } else {
    document.documentElement.classList.remove("dark");
    themeToggleBtn.textContent = "🌙 Dark";
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  themeToggleBtn.textContent = isDark ? "☀️ Light" : "🌙 Dark";
}

// FAVORITES (LOCAL STORAGE)
function updateFavCount() {
  favCount.textContent = favorites.length;
}

function toggleFavorite(code) {
  if (favorites.includes(code)) {
    favorites = favorites.filter((item) => item !== code);
  } else {
    favorites.push(code);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  updateFavCount();

  renderCountries();
  if (!favoritesSection.hidden) {
    renderFavoritesView();
  }
}

// FETCH COUNTRIES FROM API (ASYNC/AWAIT)
async function fetchCountries() {
  const requestId = ++currentRequestId;

  try {
    loading.hidden = false;
    error.hidden = true;
    empty.hidden = true;
    loadMoreBtn.hidden = true;
    countryContainer.innerHTML = "";
    countryCount.textContent = "Loading...";

    refreshBtn.disabled = true;
    refreshBtn.textContent = "Loading...";

    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Invalid API response");
    }

    if (requestId !== currentRequestId) return;

    allCountries = data;
    applyFilters();
  } catch (err) {
    if (requestId !== currentRequestId) return;
    console.error("Fetch Error:", err);
    errorMessage.textContent =
      err.message === "Failed to fetch" ? "Network error. Check your internet connection." : err.message;
    error.hidden = false;
    countryCount.textContent = "Data unavailable";
  } finally {
    if (requestId === currentRequestId) {
      loading.hidden = true;
      refreshBtn.disabled = false;
      refreshBtn.textContent = "↻ Refresh";
    }
  }
}

// SEARCH + FILTER + SORT
function applyFilters() {
  let filtered = [...allCountries];

  const searchValue = searchInput.value.trim().toLowerCase();
  if (searchValue) {
    filtered = filtered.filter((country) => country.name.toLowerCase().includes(searchValue));
  }

  const selectedRegion = regionFilter.value;
  if (selectedRegion !== "all") {
    filtered = filtered.filter((country) => country.region === selectedRegion);
  }

  const sortValue = sortSelect.value;
  if (sortValue === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortValue === "population") {
    filtered.sort((a, b) => (b.population || 0) - (a.population || 0));
  } else if (sortValue === "area") {
    filtered.sort((a, b) => (b.area || 0) - (a.area || 0));
  }

  currentFilteredCountries = filtered;
  visibleCount = COUNTRIES_PER_LOAD;
  renderCountries();
}

// CREATE CARD & RENDER (20 AT A TIME)
function createCountryCard(country) {
  const isFav = favorites.includes(country.alpha3Code);

  const card = document.createElement("article");
  card.dataset.code = country.alpha3Code;
  card.className =
    "country-card relative cursor-pointer group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300";

  // FAVORITE BUTTON
  const favBtn = document.createElement("button");
  favBtn.dataset.code = country.alpha3Code;
  favBtn.className =
    "fav-btn absolute top-3 right-3 z-10 bg-white/90 px-2.5 py-1.5 rounded-full shadow text-sm hover:scale-110 transition";
  favBtn.textContent = isFav ? "❤️" : "🤍";
  favBtn.title = "Save to Favorites";

  // FLAG IMAGE
  const imageWrapper = document.createElement("div");
  imageWrapper.className = "h-44 bg-slate-100 overflow-hidden flex items-center justify-center";

  const flagUrl =
    country.flags?.svg ||
    country.flags?.png ||
    (typeof country.flag === "string" && country.flag.startsWith("http") ? country.flag : "");

  if (flagUrl) {
    const flag = document.createElement("img");
    flag.src = flagUrl;
    flag.alt = `${country.name} flag`;
    flag.className = "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500";
    flag.loading = "lazy";
    flag.onerror = () => {
      flag.remove();
      imageWrapper.textContent = country.flag || "🌍";
      imageWrapper.classList.add("text-6xl");
    };
    imageWrapper.appendChild(flag);
  } else {
    imageWrapper.textContent = country.flag || "🌍";
    imageWrapper.classList.add("text-6xl");
  }

  // CARD CONTENT
  const info = document.createElement("div");
  info.className = "p-5";

  const name = document.createElement("h3");
  name.textContent = country.name;
  name.className = "text-xl font-bold text-slate-900 mb-3";

  const capital = document.createElement("p");
  capital.className = "text-sm text-slate-500 mb-1.5";
  capital.textContent = `Capital: ${country.capital || "N/A"}`;

  const population = document.createElement("p");
  population.className = "text-sm text-slate-500 mb-1.5";
  population.textContent = `Population: ${(country.population || 0).toLocaleString("en-IN")}`;

  const region = document.createElement("p");
  region.className = "text-sm text-slate-500 mb-1.5";
  region.textContent = `Region: ${country.region || "N/A"}`;

  const area = document.createElement("p");
  area.className = "text-sm text-slate-500";
  area.textContent = `Area: ${(country.area || 0).toLocaleString("en-IN")} km²`;

  info.append(name, capital, population, region, area);
  card.append(favBtn, imageWrapper, info);
  return card;
}

function renderCountries() {
  countryContainer.innerHTML = "";

  const total = currentFilteredCountries.length;
  const countriesToShow = currentFilteredCountries.slice(0, visibleCount);

  countryCount.textContent = `Showing ${countriesToShow.length} of ${total} Countries`;
  empty.hidden = total !== 0;

  countriesToShow.forEach((country) => {
    countryContainer.appendChild(createCountryCard(country));
  });

  if (visibleCount < total) {
    loadMoreBtn.hidden = false;
    const remaining = total - visibleCount;
    loadMoreBtn.textContent = `Load Next ${Math.min(COUNTRIES_PER_LOAD, remaining)} Countries`;
  } else {
    loadMoreBtn.hidden = true;
  }
}

// COUNTRY DETAIL MODAL + BORDER CHIPS
function formatCurrencies(currencies) {
  if (!currencies) return "N/A";
  const list = Array.isArray(currencies) ? currencies : Object.values(currencies);
  return list.map((c) => `${c.name}${c.symbol ? ` (${c.symbol})` : ""}`).join(", ") || "N/A";
}

function formatLanguages(languages) {
  if (!languages) return "N/A";
  const list = Array.isArray(languages) ? languages : Object.values(languages);
  return list.map((l) => (typeof l === "string" ? l : l.name)).join(", ") || "N/A";
}

function openCountryDetail(code) {
  const country = allCountries.find((c) => c.alpha3Code === code);
  if (!country) return;

  const flagUrl = country.flags?.svg || country.flags?.png || "";
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(country.name)}`;

  let bordersHtml = `<span class="text-sm text-slate-500">No bordering countries</span>`;
  if (country.borders && country.borders.length > 0) {
    bordersHtml = country.borders
      .map((borderCode) => {
        const borderCountry = allCountries.find((c) => c.alpha3Code === borderCode);
        const borderName = borderCountry ? borderCountry.name : borderCode;
        return `<button class="border-chip px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition" data-code="${borderCode}">
          ${borderName}
        </button>`;
      })
      .join("");
  }

  modalContent.innerHTML = `
    ${flagUrl ? `<img src="${flagUrl}" alt="${country.name}" class="w-full h-56 object-cover rounded-xl mb-5 border border-slate-200" />` : ""}
    <h2 class="text-2xl font-bold text-slate-900 mb-4">${country.name}</h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
      <p><strong>Capital:</strong> ${country.capital || "N/A"}</p>
      <p><strong>Region:</strong> ${country.region || "N/A"}</p>
      <p><strong>Population:</strong> ${(country.population || 0).toLocaleString("en-IN")}</p>
      <p><strong>Area:</strong> ${(country.area || 0).toLocaleString("en-IN")} km²</p>
      <p><strong>Currencies:</strong> ${formatCurrencies(country.currencies)}</p>
      <p><strong>Languages:</strong> ${formatLanguages(country.languages)}</p>
    </div>

    <div class="mb-5">
      <h3 class="font-semibold text-sm mb-2">Border Countries (Click to open):</h3>
      <div class="flex flex-wrap gap-2">${bordersHtml}</div>
    </div>

    <a href="${mapUrl}" target="_blank" rel="noopener noreferrer"
      class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
      📍 View on Google Maps
    </a>
  `;

  detailModal.hidden = false;
}

// FAVORITES & COMPARE VIEW
function renderFavoritesView() {
  const favCountries = allCountries.filter((c) => favorites.includes(c.alpha3Code));
  favoritesContainer.innerHTML = "";

  noFavoritesMsg.hidden = favCountries.length !== 0;

  favCountries.forEach((country) => {
    favoritesContainer.appendChild(createCountryCard(country));
  });

  if (favCountries.length < 2) {
    compareSelect1.innerHTML = "<option>Save at least 2 favorites</option>";
    compareSelect2.innerHTML = "<option>Save at least 2 favorites</option>";
    compareResult.innerHTML =
      '<p class="text-sm text-slate-500">Save at least 2 countries to compare them side by side.</p>';
    return;
  }

  const options = favCountries.map((c) => `<option value="${c.alpha3Code}">${c.name}</option>`).join("");
  compareSelect1.innerHTML = options;
  compareSelect2.innerHTML = options;
  compareSelect2.selectedIndex = 1;

  renderComparison();
}

function renderComparison() {
  const c1 = allCountries.find((c) => c.alpha3Code === compareSelect1.value);
  const c2 = allCountries.find((c) => c.alpha3Code === compareSelect2.value);
  if (!c1 || !c2) return;

  compareResult.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-200">
            <th class="py-2 pr-4">Metric</th>
            <th class="py-2 px-4">${c1.name}</th>
            <th class="py-2 px-4">${c2.name}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr>
            <td class="py-2 font-semibold">Capital</td>
            <td class="py-2 px-4">${c1.capital || "N/A"}</td>
            <td class="py-2 px-4">${c2.capital || "N/A"}</td>
          </tr>
          <tr>
            <td class="py-2 font-semibold">Region</td>
            <td class="py-2 px-4">${c1.region || "N/A"}</td>
            <td class="py-2 px-4">${c2.region || "N/A"}</td>
          </tr>
          <tr>
            <td class="py-2 font-semibold">Population</td>
            <td class="py-2 px-4">${(c1.population || 0).toLocaleString("en-IN")}</td>
            <td class="py-2 px-4">${(c2.population || 0).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td class="py-2 font-semibold">Area</td>
            <td class="py-2 px-4">${(c1.area || 0).toLocaleString("en-IN")} km²</td>
            <td class="py-2 px-4">${(c2.area || 0).toLocaleString("en-IN")} km²</td>
          </tr>
          <tr>
            <td class="py-2 font-semibold">Currencies</td>
            <td class="py-2 px-4">${formatCurrencies(c1.currencies)}</td>
            <td class="py-2 px-4">${formatCurrencies(c2.currencies)}</td>
          </tr>
          <tr>
            <td class="py-2 font-semibold">Languages</td>
            <td class="py-2 px-4">${formatLanguages(c1.languages)}</td>
            <td class="py-2 px-4">${formatLanguages(c2.languages)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// EVENT LISTENERS & EVENT DELEGATION
function handleCardGridClick(e) {
  const favBtn = e.target.closest(".fav-btn");
  if (favBtn) {
    toggleFavorite(favBtn.dataset.code);
    return;
  }

  const card = e.target.closest(".country-card");
  if (card) {
    openCountryDetail(card.dataset.code);
  }
}

countryContainer.addEventListener("click", handleCardGridClick);
favoritesContainer.addEventListener("click", handleCardGridClick);

modalContent.addEventListener("click", (e) => {
  const chip = e.target.closest(".border-chip");
  if (chip) {
    openCountryDetail(chip.dataset.code);
  }
});

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(applyFilters, 300);
});

regionFilter.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

loadMoreBtn.addEventListener("click", () => {
  visibleCount += COUNTRIES_PER_LOAD;
  renderCountries();
});

// View Switching (Explore <-> Favorites)
favoritesLink.addEventListener("click", (e) => {
  e.preventDefault();
  exploreView.hidden = true;
  favoritesSection.hidden = false;
  renderFavoritesView();
});

function showExploreView(e) {
  if (e) e.preventDefault();
  favoritesSection.hidden = true;
  exploreView.hidden = false;
}

exploreLink.addEventListener("click", showExploreView);
logoLink.addEventListener("click", showExploreView);
backToExploreBtn.addEventListener("click", showExploreView);

compareSelect1.addEventListener("change", renderComparison);
compareSelect2.addEventListener("change", renderComparison);

closeModalBtn.addEventListener("click", () => (detailModal.hidden = true));
detailModal.addEventListener("click", (e) => {
  if (e.target === detailModal) detailModal.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") detailModal.hidden = true;
});

themeToggleBtn.addEventListener("click", toggleTheme);
refreshBtn.addEventListener("click", fetchCountries);
retryBtn.addEventListener("click", fetchCountries);

// INITIALIZE APP
loadTheme();
updateFavCount();
fetchCountries();
