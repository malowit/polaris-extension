const LOCAL_CURRENCIES = [
  { code: "KZT", name: "Тенге",        sym: "₸" },
  { code: "USD", name: "US Dollar",    sym: "$" },
  { code: "EUR", name: "Euro",         sym: "€" },
  { code: "CNY", name: "Chinese Yuan", sym: "¥" },
  { code: "VND", name: "Донг",         sym: "₫" },
  { code: "THB", name: "Бат",          sym: "฿" },
];

const HOME_CURRENCIES = [
  { code: "USD", name: "US Dollar",         sym: "$"   },
  { code: "EUR", name: "Euro",              sym: "€"   },
  { code: "GBP", name: "British Pound",     sym: "£"   },
  { code: "INR", name: "Indian Rupee",      sym: "₹"   },
  { code: "CNY", name: "Chinese Yuan",      sym: "¥"   },
  { code: "JPY", name: "Japanese Yen",      sym: "¥"   },
  { code: "KRW", name: "South Korean Won",  sym: "₩"   },
  { code: "AED", name: "UAE Dirham",        sym: "AED" },
  { code: "RUB", name: "Russian Ruble",     sym: "₽"   },
  { code: "TRY", name: "Turkish Lira",      sym: "₺"   },
  { code: "AUD", name: "Australian Dollar", sym: "A$"  },
  { code: "CAD", name: "Canadian Dollar",   sym: "C$"  },
  { code: "KZT", name: "Kazakhstani Tenge", sym: "₸"   },
];

function applyTranslations() {
  document.getElementById("lbl-local").textContent      = t("localCurrency");
  document.getElementById("lbl-home").textContent       = t("homeCurrency");
  document.getElementById("hint").textContent           = t("hint");
  document.getElementById("feedback-tg").textContent    = t("feedbackTg");
  document.getElementById("feedback-email").textContent = t("feedbackEmail");
  document.getElementById("lbl-settings").textContent   = t("settings");
  document.getElementById("lbl-theme").textContent      = t("theme");
  document.getElementById("lbl-display").textContent    = t("displayMode");
  document.getElementById("lbl-autodetect").textContent = t("autoDetect");
  document.getElementById("lbl-language").textContent   = t("language");

  document.getElementById("opt-theme-system").textContent = t("themeSystem");
  document.getElementById("opt-theme-dark").textContent   = t("themeDark");
  document.getElementById("opt-theme-light").textContent  = t("themeLight");
  document.getElementById("opt-beside").textContent       = t("displayBeside");
  document.getElementById("opt-replace").textContent      = t("displayReplace");
}

function detectBrowserLang() {
  const lang = navigator.language?.slice(0, 2).toLowerCase();
  if (lang === "ru") return "ru";
  if (lang === "zh") return "zh";
  return "en";
}

async function loadSettings() {
  const s = await chrome.storage.sync.get([
    "enabled", "homeCurrency", "theme",
    "localCurrency", "localOverride",
    "displayMode", "autoDetect", "language"
  ]);
  return {
    enabled:       s.enabled       !== false,
    homeCurrency:  s.homeCurrency  || "USD",
    theme:         s.theme         || "system",
    localCurrency: s.localCurrency || null,
    localOverride: s.localOverride || false,
    displayMode:   s.displayMode   || "beside",
    autoDetect:    s.autoDetect    !== false,
    language:      s.language      || detectBrowserLang(),
  };
}

async function saveSettings(s) {
  await chrome.storage.sync.set({
    enabled:       s.enabled,
    homeCurrency:  s.homeCurrency,
    theme:         s.theme,
    localCurrency: s.localCurrency,
    localOverride: s.localOverride,
    displayMode:   s.displayMode,
    autoDetect:    s.autoDetect,
    language:      s.language,
  });
}

async function notifyTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATED" }).catch(() => {});
  } catch {}
}

function fillSelect(el, options, selected) {
  el.innerHTML = "";
  if (!selected) {
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = t("selectCurrency");
    empty.disabled = true;
    empty.selected = true;
    el.appendChild(empty);
  }
  options.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.code;
    opt.textContent = `${c.sym}  ${c.code}`;
    if (c.code === selected) opt.selected = true;
    el.appendChild(opt);
  });
}

async function showRate(from, to) {
  const el = document.getElementById("rate");
  if (!from || from === to) { el.textContent = "—"; return; }
  el.textContent = t("loadingRate");
  try {
    const resp = await chrome.runtime.sendMessage({ type: "GET_RATE", from, to });
    if (resp?.rate) {
      const sym = HOME_CURRENCIES.find(c => c.code === to)?.sym || to;
      el.innerHTML = `1 ${from} = <span class="rate-value">${sym}${resp.rate.toFixed(4)}</span>`;
    } else {
      el.textContent = t("rateUnavailable");
    }
  } catch { el.textContent = ""; }
}

function applyTheme(theme) {
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.classList.toggle("light", !prefersDark);
  } else {
    document.body.classList.toggle("light", theme === "light");
  }
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await loadSettings();

  window._polarisLang = settings.language;
  applyTranslations();

  document.getElementById("language-select").value = settings.language;

  const localSel          = document.getElementById("local-currency");
  const homeSel           = document.getElementById("home-currency");
  const toggle            = document.getElementById("toggle");
  const settingsBtn       = document.getElementById("settings-btn");
  const backBtn           = document.getElementById("back-btn");
  const themeSelect       = document.getElementById("theme-select");
  const displayModeSelect = document.getElementById("display-mode");
  const autoDetectToggle  = document.getElementById("auto-detect-toggle");

  applyTheme(settings.theme);
  toggle.checked           = settings.enabled;
  themeSelect.value        = settings.theme;
  displayModeSelect.value  = settings.displayMode;
  autoDetectToggle.checked = settings.autoDetect;

  fillSelect(localSel, LOCAL_CURRENCIES, settings.localCurrency);
  fillSelect(homeSel,  HOME_CURRENCIES,  settings.homeCurrency);
  showRate(settings.localCurrency, settings.homeCurrency);

  // ── Навигация ──
  settingsBtn.addEventListener("click", () => {
    showScreen("screen-settings");
    settingsBtn.classList.add("active");
  });
  backBtn.addEventListener("click", () => {
    showScreen("screen-main");
    settingsBtn.classList.remove("active");
  });

  // ── Главный экран ──
  toggle.addEventListener("change", async () => {
    settings.enabled = toggle.checked;
    await saveSettings(settings);
    await notifyTab();
  });

  localSel.addEventListener("change", async () => {
    settings.localCurrency = localSel.value;
    settings.localOverride = true;
    showRate(settings.localCurrency, settings.homeCurrency);
    await saveSettings(settings);
    await notifyTab();
  });

  homeSel.addEventListener("change", async () => {
    settings.homeCurrency = homeSel.value;
    showRate(settings.localCurrency, settings.homeCurrency);
    await saveSettings(settings);
    await notifyTab();
  });

  // ── Настройки ──
  themeSelect.addEventListener("change", async () => {
    settings.theme = themeSelect.value;
    applyTheme(settings.theme);
    await saveSettings(settings);
  });

  displayModeSelect.addEventListener("change", async () => {
    settings.displayMode = displayModeSelect.value;
    await saveSettings(settings);
    await notifyTab();
  });

  autoDetectToggle.addEventListener("change", async () => {
    settings.autoDetect = autoDetectToggle.checked;
    if (settings.autoDetect) {
      settings.localOverride = false;
      settings.localCurrency = null;
      fillSelect(localSel, LOCAL_CURRENCIES, null);
    } else {
      settings.localOverride = true;
    }
    await saveSettings(settings);
    await notifyTab();
  });

  document.getElementById("language-select").addEventListener("change", async (e) => {
    settings.language = e.target.value;
    window._polarisLang = settings.language;
    applyTranslations();
    await saveSettings(settings);
  });
});