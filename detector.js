// detector.js — Polaris Currency Detector

const CURRENCY_SIGNALS = {
  KZT: {
    domains:  [".kz"],
    langs:    ["kk"],
    symbols:  ["₸"],
    keywords: ["тенге", "tenge", "kzt", "тнг", "тг."],
    geo:      ["казахстан", "алматы", "астана", "нур-султан", "шымкент", "kazakhstan", "almaty", "astana", "nursultan"],
    urlKeys:  ["almaty", "astana", "kazakhstan", "nursultan"],
  },
  CNY: {
    domains:  [".cn"],
    langs:    ["zh"],
    symbols:  ["¥", "￥", "元"],
    keywords: ["yuan", "cny", "rmb", "人民币"],
    geo:      ["china", "beijing", "shanghai", "китай", "пекин", "шанхай"],
    urlKeys:  ["china", "beijing", "shanghai", "pinduoduo", "taobao", "jd"],
  },
  USD: {
    domains:  [".us"],
    langs:    ["en"],
    symbols:  ["$"],
    keywords: ["usd", "dollar"],
    geo:      ["usa", "united states", "america"],
    urlKeys:  [],
  },
  EUR: {
    domains:  [".eu"],
    langs:    ["de", "fr", "it", "es", "nl"],
    symbols:  ["€"],
    keywords: ["eur", "euro"],
    geo:      ["europe", "germany", "france", "italy", "spain"],
    urlKeys:  [],
  },
  VND: {
    domains:  [".vn"],
    langs:    ["vi"],
    symbols:  ["₫", "đ"],
    keywords: ["đồng", "vnd", "vnđ"],
    geo:      ["vietnam", "hanoi", "ho chi minh", "da nang", "вьетнам", "ханой", "дананг"],
    urlKeys:  ["vietnam", "hanoi", "danang", "hochiminh"],
  },
  THB: {
    domains:  [".th"],
    langs:    ["th"],
    symbols:  ["฿"],
    keywords: ["baht", "thb"],
    geo:      ["thailand", "bangkok", "phuket", "pattaya", "таиланд", "бангкок", "пхукет"],
    urlKeys:  ["thailand", "bangkok", "phuket", "pattaya"],
  },
  IDR: {
    domains:  [".id"],
    langs:    ["id"],
    symbols:  [],
    keywords: ["rupiah", "idr"],
    geo:      ["indonesia", "bali", "jakarta", "индонезия", "бали"],
    urlKeys:  ["indonesia", "bali", "jakarta"],
  },
  TRY: {
    domains:  [".tr", ".com.tr"],
    langs:    ["tr"],
    symbols:  ["₺"],
    keywords: ["lira", "try", " tl "],
    geo:      ["turkey", "istanbul", "ankara", "турция", "стамбул"],
    urlKeys:  ["turkey", "istanbul", "ankara"],
  },
  JPY: {
    domains:  [".jp"],
    langs:    ["ja"],
    symbols:  ["円", "¥", "￥"],
    keywords: ["yen", "jpy", "円", "税込", "税抜"],
    geo:      ["japan", "tokyo", "osaka", "япония", "токио", "осака"],
    urlKeys:  ["japan", "tokyo", "osaka", "buyee", "rakuten", "mercari"],
  },
  KRW: {
    domains:  [".kr"],
    langs:    ["ko"],
    symbols:  ["₩"],
    keywords: ["won", "krw", "원"],
    geo:      ["korea", "seoul", "корея", "сеул", "busan"],
    urlKeys:  ["korea", "seoul", "busan"],
  },
  AED: {
    domains:  [".ae"],
    langs:    ["ar"],
    symbols:  ["د.إ"],
    keywords: ["dirham", "aed", "درهم"],
    geo:      ["dubai", "abu dhabi", "uae", "дубай", "эмираты"],
    urlKeys:  ["dubai", "abudhabi", "uae"],
  },
};

const SCORES = {
  domain:  70,
  url:     20,
  lang:    30,
  meta:    80,
  symbol:  40,
  keyword: 30,
  geo:     15,
};

const CONFIDENCE_THRESHOLD = 60;

function detectCurrency() {
  const scores = {};
  for (const currency of Object.keys(CURRENCY_SIGNALS)) {
    scores[currency] = 0;
  }

  const hostname = window.location.hostname.toLowerCase();
  const fullUrl  = window.location.href.toLowerCase();
  const lang     = (document.documentElement.lang || navigator.language || "").toLowerCase().slice(0, 2);
  const bodyText = document.body?.innerText?.toLowerCase() || "";
  const metaTags = document.head?.querySelectorAll("meta") || [];

  metaTags.forEach(tag => {
    const content = (tag.getAttribute("content") || "").toUpperCase();
    const name    = (tag.getAttribute("name") || tag.getAttribute("property") || "").toLowerCase();
    if (name.includes("currency") || name.includes("price:currency")) {
      if (scores[content] !== undefined) scores[content] += SCORES.meta;
    }
  });

  for (const [currency, signals] of Object.entries(CURRENCY_SIGNALS)) {
    if (signals.domains.some(d => hostname.endsWith(d))) scores[currency] += SCORES.domain;
    if (signals.urlKeys?.some(k => k && fullUrl.includes(k))) scores[currency] += SCORES.url;
    if (signals.langs.includes(lang)) scores[currency] += SCORES.lang;
    if (signals.symbols.some(s => bodyText.includes(s))) scores[currency] += SCORES.symbol;
    if (signals.keywords.some(k => bodyText.includes(k.toLowerCase()))) scores[currency] += SCORES.keyword;
    if (signals.geo.some(g => bodyText.includes(g.toLowerCase()))) scores[currency] += SCORES.geo;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best   = sorted[0];

  console.log(`Polaris detector: ${sorted.slice(0,3).map(([c,s]) => `${c}:${s}`).join(" | ")}`);

  if (best && best[1] >= CONFIDENCE_THRESHOLD) {
    return { currency: best[0], confidence: best[1], auto: true };
  }

  return { currency: null, confidence: 0, auto: false };
}