const API_URL =
  "https://countries.dev/countries?fields=name,flags,flag,population,capital,region,area,borders,currencies,languages,alpha3Code";

const countryContainer = document.getElementById("countryContainer");
const countryCount = document.getElementById("countryCount");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const errorMessage = document.getElementById("errorMessage");
const empty = document.getElementById("empty");
const refreshBtn = document.getElementById("refreshBtn");
const retryBtn = document.getElementById("retryBtn");
const searchInput = document.getElementById("searchInput");
const regionFilter = document.getElementById("regionFilter");
const sortSelect = document.getElementById("sortSelect");

let allCountries = [];
let currentRequestId = 0;
let debounceTimer = null;

async function fetchCountries() {
  const requestId = ++currentRequestId;
  try {
    loading.hidden = false;
    error.hidden = true;
    empty.hidden = true;
    countryContainer.innerHTML = "";
    countryCount.textContent = "Loading...";
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Loading...";

    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid API response");
    if (requestId !== currentRequestId) return;

    allCountries = data;
    applyFilters();
  } catch (err) {
    if (requestId !== currentRequestId) return;
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

function createCountryCard(country) {
  const card = document.createElement("article");
  card.dataset.code = country.alpha3Code;
  card.className =
    "country-card relative cursor-pointer group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300";

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "h-44 bg-slate-100 overflow-hidden flex items-center justify-center";
  const flagUrl = country.flags?.svg || country.flags?.png || "";
  if (flagUrl) {
    const flag = document.createElement("img");
    flag.src = flagUrl;
    flag.alt = `${country.name} flag`;
    flag.className = "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500";
    flag.loading = "lazy";
    imageWrapper.appendChild(flag);
  } else {
    imageWrapper.textContent = country.flag || "🌍";
    imageWrapper.classList.add("text-6xl");
  }

  const info = document.createElement("div");
  info.className = "p-5";
  info.innerHTML = `
    <h3 class="text-xl font-bold text-slate-900 mb-3">${country.name}</h3>
    <p class="text-sm text-slate-500 mb-1.5">Capital: ${country.capital || "N/A"}</p>
    <p class="text-sm text-slate-500 mb-1.5">Population: ${(country.population || 0).toLocaleString("en-IN")}</p>
    <p class="text-sm text-slate-500 mb-1.5">Region: ${country.region || "N/A"}</p>
    <p class="text-sm text-slate-500">Area: ${(country.area || 0).toLocaleString("en-IN")} km²</p>
  `;

  card.append(imageWrapper, info);
  return card;
}

function renderCountries(list) {
  countryContainer.innerHTML = "";
  countryCount.textContent = `${list.length} Countries`;
  empty.hidden = list.length !== 0;
  list.forEach((country) => countryContainer.appendChild(createCountryCard(country)));
}

function applyFilters() {
  let filtered = [...allCountries];
  const searchValue = searchInput.value.trim().toLowerCase();
  if (searchValue) {
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(searchValue));
  }
  const selectedRegion = regionFilter.value;
  if (selectedRegion !== "all") {
    filtered = filtered.filter((c) => c.region === selectedRegion);
  }
  const sortValue = sortSelect.value;
  if (sortValue === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortValue === "population") filtered.sort((a, b) => (b.population || 0) - (a.population || 0));
  else if (sortValue === "area") filtered.sort((a, b) => (b.area || 0) - (a.area || 0));

  renderCountries(filtered);
}

refreshBtn.addEventListener("click", fetchCountries);
retryBtn.addEventListener("click", fetchCountries);
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(applyFilters, 300);
});
regionFilter.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

fetchCountries();
