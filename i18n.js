// i18n.js — Polaris translations

const TRANSLATIONS = {
  en: {
    // Main screen
    localCurrency:    "LOCAL CURRENCY",
    homeCurrency:     "MY CURRENCY",
    autoDetected:     "● detected automatically",
    manuallySet:      "manually selected",
    notDetected:      "not detected",
    resetToAuto:      "↺ reset to auto",
    hint: "Make sure the currency is correct",
    loadingRate:      "loading rate...",
    rateUnavailable:  "rate unavailable",
    feedbackTg:    "Report a bug",
    feedbackEmail: "Write an email",
    selectCurrency:   "— select currency —",

    // Settings
    settings:         "Settings",
    theme:            "THEME",
    themeSystem:      "System default",
    themeDark:        "Dark",
    themeLight:       "Light",
    displayMode:      "POLARIS DISPLAY",
    displayBeside:    "Show alongside",
    displayReplace:   "Replace original",
    autoDetect:       "AUTO-DETECT CURRENCY",
    language:         "LANGUAGE",
  },
  ru: {
    localCurrency:    "МЕСТНАЯ ВАЛЮТА",
    homeCurrency:     "МОЯ ВАЛЮТА",
    autoDetected:     "● определено автоматически",
    manuallySet:      "выбрано вручную",
    notDetected:      "не определено",
    resetToAuto:      "↺ вернуть авто",
    hint: "Убедитесь что валюта выбрана верно",
    loadingRate:      "загружаем курс...",
    rateUnavailable:  "курс недоступен",
    feedbackTg:    "Сообщить об ошибке",
    feedbackEmail: "Написать на почту",
    selectCurrency:   "— выберите валюту —",

    settings:         "Настройки",
    theme:            "ТЕМА",
    themeSystem:      "Как в системе",
    themeDark:        "Тёмная",
    themeLight:       "Светлая",
    displayMode:      "ОТОБРАЖЕНИЕ POLARIS",
    displayBeside:    "Показывать рядом",
    displayReplace:   "Заменять оригинал",
    autoDetect:       "АВТООПРЕДЕЛЕНИЕ ВАЛЮТЫ",
    language:         "ЯЗЫК",
  },
  zh: {
    localCurrency:    "当地货币",
    homeCurrency:     "我的货币",
    autoDetected:     "● 自动检测",
    manuallySet:      "手动选择",
    notDetected:      "未检测到",
    resetToAuto:      "↺ 恢复自动",
    hint: "请确认货币选择正确",
    loadingRate:      "加载汇率...",
    rateUnavailable:  "汇率不可用",
    feedbackTg:    "报告错误",
    feedbackEmail: "发送邮件 ",
    selectCurrency:   "— 请选择货币 —",

    settings:         "设置",
    theme:            "主题",
    themeSystem:      "跟随系统",
    themeDark:        "深色",
    themeLight:       "浅色",
    displayMode:      "POLARIS 显示方式",
    displayBeside:    "显示在旁边",
    displayReplace:   "替换原价",
    autoDetect:       "自动检测货币",
    language:         "语言",
  },
};

function t(key) {
  const lang = window._polarisLang || "en";
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}