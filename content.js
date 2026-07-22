// content.js — Polaris v0.1.7

const POLARIS_MARKER = "data-polaris";

const CURRENCY_SYMBOLS = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", KRW: "₩",
  INR: "₹", RUB: "₽", TRY: "₺", AED: "AED",
  AUD: "A$", CAD: "C$", CNY: "¥", SGD: "S$",
  KZT: "₸", VND: "₫", THB: "฿",
};

const PRICE_PATTERNS = {
  KZT: [
    /\b(\d[\d,\s]{0,11}\d|\d+)\s*₸/g,
    /₸\s*(\d[\d,\s]{0,11}\d|\d+)/g,
    /\b(\d[\d,\s]{0,11}\d|\d+)\s*т(?:нг|г)\.?(?=[\s,.\u00A0]|$)/gi,
    /KZT\s*(\d[\d,\s]{0,11}\d|\d+)/gi,
    /\b(\d[\d,\s]{0,11}\d|\d+)\s*тенге\.?(?=[\s,!?.]|$)/gi,
    /\b(\d[\d,\s]{0,11}\d|\d+)\s*tenge\.?(?=[\s,!?.]|$)/gi,
  ],
  USD: [
    /\$\s*(\d[\d,.\s]{0,11}\d|\d+)/g,
    /\b(\d[\d,.\s]{0,11}\d|\d+)\s*\$(?!\w)/g,
    /USD\s*(\d[\d,.\s]{0,11}\d|\d+)/gi,
    /\b(\d[\d,.\s]{0,11}\d|\d+)\s*dollars?\.?(?=[\s,!?.]|$)/gi,
  ],
  EUR: [
    /€\s*(\d[\d,.\s]{0,11}\d|\d+)/g,
    /\b(\d[\d,.\s]{0,11}\d|\d+)\s*€/g,
    /EUR\s*(\d[\d,.\s]{0,11}\d|\d+)/gi,
    /\b(\d[\d,.\s]{0,11}\d|\d+)\s*euros?\.?(?=[\s,!?.]|$)/gi,
  ],
  CNY: [
    /[¥￥]\s*(\d[\d,.\s]{0,11}\d|\d+)/g,
    /\b(\d[\d,.\s]{0,11}\d|\d+)\s*[¥￥](?!\w)/g,
    /CNY\s*(\d[\d,.\s]{0,11}\d|\d+)/gi,
    /元\s*(\d[\d,.\s]{0,11}\d|\d+)/g,
    /\b(\d[\d,.\s]{0,11}\d|\d+)\s*元/g,
    /\b(\d[\d,.\s]{0,11}\d|\d+)\s*yuan\.?(?=[\s,!?.]|$)/gi,
  ],
  VND: [
    /\b(\d[\d.,\s]{0,11}\d|\d+)\s*[₫đ]/g,
    /[₫đ]\s*(\d[\d.,\s]{0,11}\d|\d+)/g,
    /\bVND\s*(\d[\d.,\s]{0,11}\d|\d+)/gi,
    /\b(\d[\d.,\s]{0,11}\d|\d+)\s*VND\b/gi,
    /\b(\d[\d.,\s]{0,11}\d|\d+)\s*đồng\.?(?=[\s,!?.]|$)/gi,
    /\b(\d[\d.,\s]{0,11}\d|\d+)\s*dong\.?(?=[\s,!?.]|$)/gi,
  ],
  THB: [
    /฿\s*(\d[\d,.\s]{0,11}\d|\d+)/g,
    /\b(\d[\d,.\s]{0,11}\d|\d+)\s*฿/g,
    /\b(\d[\d,.\s]{0,11}\d|\d+)\s*(?:THB|baht)\.?(?=[\s,!?.]|$)/gi,
  ],
};

const SPLIT_CURRENCY_SYMBOLS = {
  KZT: /^[₸]$|^т(?:нг|г)\.?$/i,
  USD: /^\$$/,
  EUR: /^€$/,
  CNY: /^[¥￥]$|^元$/,
  VND: /^[₫đ]$|^vnd$/i,
  THB: /^฿$|^thb$/i,
};

let cfg = {
  enabled:          true,
  localCurrency:    null,
  homeCurrency:     "USD",
  rate:             null,
  detectedAuto:     false,
  confidence:       0,
  detectedCurrency: null,
  displayMode:      "beside",
};

// ── Утилиты ──────────────────────────────────────────────────────

function parseNum(str) {
  return parseFloat(str.replace(/[\s\u00A0,]/g, "").replace(/\.(?=\d{3})/g, ""));
}

function formatNum(num) {
  if (num >= 100) return Math.round(num).toLocaleString("ru-RU");
  return num.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function makeBadge(text, title) {
  const badge = document.createElement("span");
  badge.setAttribute(POLARIS_MARKER, "true");
  badge.textContent = text;
  badge.title = title;
  badge.style.cssText = [
    "all:initial",
    "display:inline",
    "font-family:inherit",
    "font-size:1em",
    "font-weight:inherit",
    "line-height:inherit",
    "background:#8f32a4",
    "border-radius:2px",
    "padding:0 5px",
    "margin-left:3px",
    "white-space:nowrap",
    "cursor:pointer",
    "vertical-align:baseline",
  ].join(";");
  badge.style.setProperty("color", "#ffffff", "important");
  return badge;
}

function makeToggleWrapper(originalText, badgeText, badgeTitle) {
  const wrapper = document.createElement("span");
  wrapper.setAttribute(POLARIS_MARKER, "true");
  wrapper.style.cssText = "display:inline; white-space:nowrap;";

  const originalSpan = document.createElement("span");
  originalSpan.textContent = originalText;
  originalSpan.style.display = "none";

  const badge = makeBadge(badgeText, badgeTitle);
  wrapper.appendChild(originalSpan);
  wrapper.appendChild(badge);

  wrapper.addEventListener("click", (e) => {
    e.stopPropagation();
    const showingBadge = originalSpan.style.display === "none";
    originalSpan.style.display = showingBadge ? "inline" : "none";
    badge.style.display        = showingBadge ? "none"   : "inline";
  });

  return wrapper;
}

function makeDisplay(originalText, badgeText, badgeTitle) {
  if (cfg.displayMode === "replace") {
    return makeToggleWrapper(originalText, badgeText, badgeTitle);
  }
  const wrapper = document.createElement("span");
  wrapper.setAttribute(POLARIS_MARKER, "true");
  wrapper.style.cssText = "display:inline; white-space:nowrap;";
  wrapper.appendChild(document.createTextNode(originalText));
  wrapper.appendChild(makeBadge(badgeText, badgeTitle));
  return wrapper;
}

// ── Метод 1: текстовые узлы ───────────────────────────────────────

const SKIP_TAGS = new Set(["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","INPUT","CODE","PRE","SVG"]);

function processTextNode(textNode) {
  if (!cfg.enabled || !cfg.rate) return;
  const text = textNode.textContent;
  if (!text.trim()) return;
  if (textNode.parentElement?.closest(`[${POLARIS_MARKER}]`)) return;

  const patterns = PRICE_PATTERNS[cfg.localCurrency];
  if (!patterns) return;

  const hasMatch = patterns.some(p => { p.lastIndex = 0; return p.test(text); });
  if (!hasMatch) return;

  const matches = [];
  patterns.forEach(pattern => {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const rawNum = m[1] ?? m[2];
      if (!rawNum) continue;
      const num = parseNum(rawNum);
      if (isNaN(num) || num <= 0 || num > 999_999_999) continue;
      matches.push({ index: m.index, length: m[0].length, original: m[0], num });
    }
  });

  if (!matches.length) return;

  matches.sort((a, b) => a.index - b.index);
  const unique = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.index >= lastEnd) {
      unique.push(match);
      lastEnd = match.index + match.length;
    }
  }

  const fragment = document.createDocumentFragment();
  let cursor = 0;
  const sym = CURRENCY_SYMBOLS[cfg.homeCurrency] || cfg.homeCurrency;

  for (const match of unique) {
    if (match.index > cursor)
      fragment.appendChild(document.createTextNode(text.slice(cursor, match.index)));

    const beforeMatch = text.slice(0, match.index);
    const rangePrefix = beforeMatch.match(/(\d[\d\s]*\d|\d+)\s*[–—-]\s*$/);

    if (rangePrefix) {
      fragment.appendChild(document.createTextNode(match.original));
    } else {
      const afterMatch  = text.slice(match.index + match.length);
      const rangeSuffix = afterMatch.match(/^\s*[–—-]\s*(\d[\d\s]*\d|\d+)/);

      let badgeText, badgeTitle;

      if (rangeSuffix) {
        const num2 = parseNum(rangeSuffix[1]);
        if (!isNaN(num2) && num2 > 0) {
          const conv1 = match.num * cfg.rate;
          const conv2 = num2 * cfg.rate;
          badgeText  = ` ${sym}${formatNum(conv1)}–${formatNum(conv2)}`;
          badgeTitle = `Polaris: ${formatNum(match.num)}–${formatNum(num2)} ${cfg.localCurrency} → ${sym}${formatNum(conv1)}–${formatNum(conv2)} ${cfg.homeCurrency}`;
        }
      }

      if (!badgeText) {
        const converted = match.num * cfg.rate;
        badgeText  = ` ${sym}${formatNum(converted)}`;
        badgeTitle = `Polaris: ${formatNum(match.num)} ${cfg.localCurrency} → ${sym}${formatNum(converted)} ${cfg.homeCurrency}`;
      }

      fragment.appendChild(makeDisplay(match.original, badgeText, badgeTitle));
    }

    cursor = match.index + match.length;
  }

  if (cursor < text.length)
    fragment.appendChild(document.createTextNode(text.slice(cursor)));

  textNode.parentNode.replaceChild(fragment, textNode);
  // Помечаем родительский элемент как обработанный
  if (textNode.parentElement) {
    textNode.parentElement.setAttribute(POLARIS_MARKER, "done");
  }

}

function walkTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const el = node.parentElement;
      if (!el) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
      if (el.closest(`[${POLARIS_MARKER}]`)) return NodeFilter.FILTER_REJECT;
      if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(processTextNode);
}

// ── Метод 2: разорванные цены ─────────────────────────────────────

// Валюты где символ стоит ПЕРЕД числом: ¥100, $100, €100
const CURRENCY_PREFIX = new Set(["USD", "EUR", "CNY"]);

function handleSplitPrices(root) {
  if (!cfg.rate) return;
  const currencyPattern = SPLIT_CURRENCY_SYMBOLS[cfg.localCurrency];
  if (!currencyPattern) return;

  const sym = CURRENCY_SYMBOLS[cfg.homeCurrency] || cfg.homeCurrency;
  const isPrefix = CURRENCY_PREFIX.has(cfg.localCurrency);
  const candidates = root.querySelectorAll
    ? root.querySelectorAll("span, b, strong, p")
    : [];

  candidates.forEach(el => {
    if (el.closest(`[${POLARIS_MARKER}]`)) return;

    const text = el.textContent.trim();
    if (!currencyPattern.test(text)) return;

    if (isPrefix) {
      // Символ перед числом — смотрим ВПРАВО
      if (el.nextElementSibling?.getAttribute?.(POLARIS_MARKER)) return;

      let next = el.nextSibling;
      while (next && next.nodeType === Node.TEXT_NODE && !next.textContent.trim()) {
        next = next.nextSibling;
      }
      if (!next) return;
      const nextText = (next.textContent || "").trim();
      if (!nextText) return;

      const numMatch = nextText.match(/^(\d[\d.,\s]*\d|\d+)/);
      if (!numMatch) return;
      const num = parseNum(numMatch[1]);
      if (isNaN(num) || num <= 0 || num >= 999_999_999) return;

      // Проверяем не добавляли ли уже бейдж после next
      if (next.nextSibling?.getAttribute?.(POLARIS_MARKER)) return;

      const badge = makeBadge(
        ` ${sym}${formatNum(num * cfg.rate)}`,
        `Polaris: ${formatNum(num)} ${cfg.localCurrency} → ${sym}${formatNum(num * cfg.rate)} ${cfg.homeCurrency}`
      );
      // Вставляем после следующего элемента с числом
      if (next.nodeType === Node.TEXT_NODE) {
        next.parentNode.insertBefore(badge, next.nextSibling);
      } else {
        next.after(badge);
      }

    } else {
      // Символ после числа — смотрим ВЛЕВО (прежняя логика)
      if (el.nextElementSibling?.getAttribute?.(POLARIS_MARKER)) return;

      let prev = el.previousSibling;
      while (prev && prev.nodeType === Node.TEXT_NODE && !prev.textContent.trim()) {
        prev = prev.previousSibling;
      }
      if (!prev) return;
      const prevText = (prev.textContent || "").trim();
      if (!prevText) return;

      // Оба числа диапазона в одном узле "2 000–4 000"
      const rangeMatch = prevText.match(/(\d[\d\s]*\d|\d+)\s*[–—-]\s*(\d[\d\s]*\d|\d+)\s*$/);
      if (rangeMatch) {
        const n1 = parseNum(rangeMatch[1]), n2 = parseNum(rangeMatch[2]);
        if (!isNaN(n1) && !isNaN(n2) && n1 > 0 && n2 > 0) {
          el.after(makeBadge(
            ` ${sym}${formatNum(n1 * cfg.rate)}–${formatNum(n2 * cfg.rate)}`,
            `Polaris: ${formatNum(n1)}–${formatNum(n2)} ${cfg.localCurrency} → ${sym}${formatNum(n1 * cfg.rate)}–${formatNum(n2 * cfg.rate)} ${cfg.homeCurrency}`
          ));
          return;
        }
      }

      // Одно число, ищем первое левее через тире
      const numMatch = prevText.match(/(\d[\d\s]*\d|\d+)\s*$/);
      if (numMatch) {
        const n2 = parseNum(numMatch[1]);
        if (!isNaN(n2) && n2 > 0 && n2 < 999_999_999) {

          let scanNode = prev.previousSibling;
          while (scanNode && scanNode.nodeType === Node.TEXT_NODE && !scanNode.textContent.trim()) {
            scanNode = scanNode.previousSibling;
          }
          const scanText = (scanNode?.textContent || "").trim();
          const rangeStartMatch = scanText.match(/(\d[\d\s]*\d|\d+)\s*[–—-]\s*$/);

          if (rangeStartMatch) {
            const n1 = parseNum(rangeStartMatch[1]);
            if (!isNaN(n1) && n1 > 0 && n1 < n2) {
              el.after(makeBadge(
                ` ${sym}${formatNum(n1 * cfg.rate)}–${formatNum(n2 * cfg.rate)}`,
                `Polaris: ${formatNum(n1)}–${formatNum(n2)} ${cfg.localCurrency} → ${sym}${formatNum(n1 * cfg.rate)}–${formatNum(n2 * cfg.rate)} ${cfg.homeCurrency}`
              ));
              return;
            }
          }

          el.after(makeBadge(
            ` ${sym}${formatNum(n2 * cfg.rate)}`,
            `Polaris: ${formatNum(n2)} ${cfg.localCurrency} → ${sym}${formatNum(n2 * cfg.rate)} ${cfg.homeCurrency}`
          ));
        }
      }
    }
  });
}
// ── Метод 3: Shadow DOM ───────────────────────────────────────────

const observedRoots = new WeakSet();
// ── Метод 3б: символ в родителе, число в дочернем span ───────────
// Для Pinduoduo: <div>￥<span>39.9</span></div>

function handleParentSymbol(root) {
  if (!cfg.rate) return;
  const currencyPattern = SPLIT_CURRENCY_SYMBOLS[cfg.localCurrency];
  if (!currencyPattern) return;
  if (!CURRENCY_PREFIX.has(cfg.localCurrency)) return;

  const sym = CURRENCY_SYMBOLS[cfg.homeCurrency] || cfg.homeCurrency;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!currencyPattern.test(node.textContent.trim())) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(`[${POLARIS_MARKER}]`)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(node => {
    let next = node.nextSibling;
    while (next && next.nodeType === Node.TEXT_NODE && !next.textContent.trim()) {
      next = next.nextSibling;
    }
    if (!next || next.nodeType !== Node.ELEMENT_NODE) return;
    if (next.getAttribute(POLARIS_MARKER)) return; // ← уже обработан

    const numText = next.textContent.trim();
    const numMatch = numText.match(/^(\d[\d.,]*\d|\d+)$/);
    if (!numMatch) return;

    const num = parseNum(numMatch[1]);
    if (isNaN(num) || num <= 0 || num >= 999_999_999) return;

    if (next.nextSibling?.nodeType === Node.ELEMENT_NODE &&
        next.nextSibling.getAttribute(POLARIS_MARKER)) return;

    const badge = makeBadge(
      ` ${sym}${formatNum(num * cfg.rate)}`,
      `Polaris: ${formatNum(num)} ${cfg.localCurrency} → ${sym}${formatNum(num * cfg.rate)} ${cfg.homeCurrency}`
    );
    next.setAttribute(POLARIS_MARKER, "done"); // ← помечаем источник
    next.after(badge);
  });
}

// ── Метод 4: семантический поиск по CSS-классам и атрибутам ──────
// Ищем элементы где разработчик сам указал что это цена

function findSemanticPrices(root) {
  if (!cfg.rate) return;
  const sym = CURRENCY_SYMBOLS[cfg.homeCurrency] || cfg.homeCurrency;

  const PRICE_RE = /price|cost|amount|прайс|стоимость|цена|тариф|сумма/i;

  const byAttr = root.querySelectorAll
    ? [...root.querySelectorAll('[itemprop="price"], [data-price], [data-amount], [data-cost]')]
    : [];

  const byClass = [];
  if (root.querySelectorAll) {
    root.querySelectorAll("*").forEach(el => {
      if (
        PRICE_RE.test(el.className || "") ||
        PRICE_RE.test(el.id || "")
      ) {
        byClass.push(el);
      }
    });
  }

  const candidates = new Set([...byAttr, ...byClass]);

  candidates.forEach(el => {
    // Пропускаем уже обработанные любым методом
    if (el.getAttribute(POLARIS_MARKER)) return;
    if (el.closest(`[${POLARIS_MARKER}]`)) return;

    // Проверяем что после элемента нет бейджа
    let checkEl = el.nextSibling;
    while (checkEl && checkEl.nodeType === Node.TEXT_NODE && !checkEl.textContent.trim()) {
      checkEl = checkEl.nextSibling;
    }
    if (checkEl?.nodeType === Node.ELEMENT_NODE && checkEl.getAttribute(POLARIS_MARKER)) return;

    if (el.children.length > 1) return;

    const text = el.textContent.trim();
    if (!text) return;

    const numMatch = text.match(/^[^\d]*(\d[\d\s,.']*)$/);
    if (!numMatch) return;

    const num = parseNum(numMatch[1]);
    if (isNaN(num) || num < 10 || num > 999_999_999) return;

    const digits = text.replace(/\D/g, "");
    if (digits.length === 4 && num >= 1900 && num <= 2099) return;
    if (digits.length > 10) return;

    el.setAttribute(POLARIS_MARKER, "done"); // ← помечаем источник
    el.after(makeBadge(
      ` ${sym}${formatNum(num * cfg.rate)}`,
      `Polaris: ${formatNum(num)} ${cfg.localCurrency} → ${sym}${formatNum(num * cfg.rate)} ${cfg.homeCurrency}`
    ));
  });
}

// ── Скоринг соответствия страницы выбранной валюте ───────────────

function getPageConfidence() {
  const hostname = window.location.hostname.toLowerCase();
  const bodyText = document.body?.innerText?.toLowerCase() || "";
  const signals  = CURRENCY_SIGNALS[cfg.localCurrency];
  let score = 0;

  if (!signals) return 0;

  // Домен совпадает с валютой
  if (signals.domains?.some(d => hostname.endsWith(d))) score += 50;

  // Символ валюты встречается в тексте страницы
  const patterns = PRICE_PATTERNS[cfg.localCurrency] || [];
  const hasSymbol = patterns.some(p => {
    p.lastIndex = 0;
    return p.test(bodyText);
  });
  if (hasSymbol) score += 50;

  // Ключевые слова
  if (signals.keywords?.some(k => bodyText.includes(k.toLowerCase()))) score += 20;

  return score;
}

function walkWithShadow(root) {
  const confidence = getPageConfidence();

  if (confidence === 0) {
    // Нет признаков выбранной валюты — не конвертируем
    console.log(`Polaris ✦ score: ${confidence} — конвертация пропущена`);
    return;
  }

  walkTextNodes(root);
  handleSplitPrices(root);
  handleParentSymbol(root);

  if (confidence >= 50) {
    // Высокая уверенность — включаем семантический поиск
    findSemanticPrices(root);
  }

  console.log(`Polaris ✦ score: ${confidence}`);

  try {
    const allEls = root.querySelectorAll ? root.querySelectorAll("*") : [];
    allEls.forEach(el => {
      if (el.shadowRoot) {
        walkWithShadow(el.shadowRoot);
        attachObserver(el.shadowRoot);
      }
    });
  } catch (e) {}
}

function attachObserver(root) {
  if (observedRoots.has(root)) return;
  observedRoots.add(root);
  new MutationObserver((mutations) => {
    for (const mutation of mutations)
      for (const node of mutation.addedNodes)
        if (node.nodeType === Node.ELEMENT_NODE) walkWithShadow(node);
  }).observe(root, { childList: true, subtree: true });
}

// ── Инициализация ─────────────────────────────────────────────────

async function init() {
  const stored = await chrome.storage.sync.get([
    "enabled", "localCurrency", "homeCurrency",
    "localOverride", "displayMode", "autoDetect"
  ]);

  cfg.enabled      = stored.enabled      !== false;
  cfg.homeCurrency = stored.homeCurrency || "USD";
  cfg.displayMode  = stored.displayMode  || "beside";

  if (!cfg.enabled) return;

  // Определяем локальную валюту
  if (stored.localCurrency) {
    // Валюта уже выбрана (вручную или ранее автоопределена) — используем её
    cfg.localCurrency = stored.localCurrency;
  } else {
    // Валюта не задана — запускаем детектор один раз
    const detected = detectCurrency();
    if (detected.currency) {
      cfg.localCurrency = detected.currency;
      // Сохраняем как localCurrency — дальше детектор не нужен
      chrome.storage.sync.set({ localCurrency: detected.currency, localOverride: false });
      console.log(`Polaris ✦ ${cfg.localCurrency} (авто, score: ${detected.confidence})`);
    } else {
      cfg.localCurrency = null;
      console.log("Polaris ✦ валюта не определена");
      return;
    }
  }

  // Защита: не конвертируем если валюты совпадают
  if (cfg.localCurrency === cfg.homeCurrency) {
    console.log(`Polaris ✦ локальная и домашняя валюта совпадают (${cfg.localCurrency}) — конвертация не нужна`);
    return;
  }

  try {
    const resp = await chrome.runtime.sendMessage({
      type: "GET_RATE",
      from: cfg.localCurrency,
      to:   cfg.homeCurrency,
    });
    cfg.rate = resp?.rate ?? null;
  } catch (e) {
    console.warn("Polaris: не удалось получить курс", e);
    return;
  }

  if (!cfg.rate) return;

  console.log(`Polaris ✦ курс ${cfg.localCurrency}→${cfg.homeCurrency} = ${cfg.rate}`);
  walkWithShadow(document.body);
  attachObserver(document.body);

  setTimeout(() => walkWithShadow(document.body), 2000);
  setTimeout(() => walkWithShadow(document.body), 5000);
  setTimeout(() => walkWithShadow(document.body), 10000);
  setTimeout(() => walkWithShadow(document.body), 15000);

  let scrollTimer = null;
  window.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => walkWithShadow(document.body), 500);
  }, { passive: true });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SETTINGS_UPDATED") window.location.reload();
});

init();