// background.js — фоновый скрипт Polaris
// Получает и кэширует курсы валют.
// Использует два API с фоллбэком:
//   1. cdn.jsdelivr.net/npm/@fawazahmed0/currency-api — поддерживает KZT и сотни других валют
//   2. api.frankfurter.app — резервный, для основных мировых валют

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_RATE") {
    getRate(request.from, request.to).then(rate => {
      sendResponse({ rate });
    });
    return true; // асинхронный ответ
  }
});

async function getRate(from, to) {
  if (from === to) return 1;

  const cacheKey = `rate_${from}_${to}`;

  // Смотрим кэш — если свежее 1 часа, возвращаем его
  const cached = await chrome.storage.local.get(cacheKey);
  const entry = cached[cacheKey];
  if (entry && Date.now() - entry.timestamp < 3_600_000) {
    console.log(`Polaris: курс из кэша ${from}→${to} = ${entry.value}`);
    return entry.value;
  }

  // ── API #1: fawazahmed0 (поддерживает KZT, VND, THB и почти все валюты мира) ──
  try {
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from.toLowerCase()}.json`;
    const resp = await fetch(url);
    const data = await resp.json();
    const rate = data[from.toLowerCase()]?.[to.toLowerCase()];

    if (rate) {
      await chrome.storage.local.set({
        [cacheKey]: { value: rate, timestamp: Date.now() }
      });
      console.log(`Polaris: курс (API#1) ${from}→${to} = ${rate}`);
      return rate;
    }
  } catch (err) {
    console.warn("Polaris: API#1 недоступен, пробуем резервный", err);
  }

  // ── API #2: frankfurter (резервный, для EUR/USD/GBP и тд) ──
  try {
    const url = `https://api.frankfurter.app/latest?from=${from}&to=${to}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const rate = data.rates?.[to];

    if (rate) {
      await chrome.storage.local.set({
        [cacheKey]: { value: rate, timestamp: Date.now() }
      });
      console.log(`Polaris: курс (API#2) ${from}→${to} = ${rate}`);
      return rate;
    }
  } catch (err) {
    console.error("Polaris: оба API недоступны", err);
  }

  return null;
}
