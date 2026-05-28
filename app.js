
// --------- Supported languages ---------
const LANGUAGES = [
  { code: "auto", name: "Auto Detect" },
  { code: "en", name: "English" },
  { code: "ml", name: "Malayalam" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ar", name: "Arabic" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
];

// Multiple LibreTranslate mirrors — we try them in order for resilience
const API_ENDPOINTS = [
  "https://libretranslate.de/translate",
  "https://translate.argosopentech.com/translate",
  "https://translate.terraprint.co/translate",
];

const HISTORY_KEY = "linguaflow_history";
const THEME_KEY = "linguaflow_theme";
const MAX_HISTORY = 5;

// --------- DOM references ---------
const $ = (sel) => document.querySelector(sel);

const sourceLang = $("#sourceLang");
const targetLang = $("#targetLang");
const inputText = $("#inputText");
const outputText = $("#outputText");
const outputMeta = $("#outputMeta");
const charCount = $("#charCount");
const translateBtn = $("#translateBtn");
const swapBtn = $("#swapBtn");
const clearBtn = $("#clearBtn");
const copyBtn = $("#copyBtn");
const speakBtn = $("#speakBtn");
const spinner = $("#spinner");
const themeToggle = $("#themeToggle");
const historyToggle = $("#historyToggle");
const historyPanel = $("#historyPanel");
const historyList = $("#historyList");
const historyEmpty = $("#historyEmpty");
const clearHistoryBtn = $("#clearHistoryBtn");
const toast = $("#toast");

// --------- Initialization ---------
document.addEventListener("DOMContentLoaded", () => {
  populateLanguages();
  loadTheme();
  renderHistory();
  bindEvents();
  document.getElementById("year").textContent = new Date().getFullYear();
});

// Populate both language dropdowns
function populateLanguages() {
  LANGUAGES.forEach((lang) => {
    sourceLang.appendChild(buildOption(lang));
    // target dropdown skips "auto"
    if (lang.code !== "auto") targetLang.appendChild(buildOption(lang));
  });
  sourceLang.value = "auto";
  targetLang.value = "es";
}
function buildOption({ code, name }) {
  const opt = document.createElement("option");
  opt.value = code;
  opt.textContent = name;
  return opt;
}

// --------- Event bindings ---------
function bindEvents() {
  inputText.addEventListener("input", updateCharCount);
  translateBtn.addEventListener("click", handleTranslate);
  swapBtn.addEventListener("click", handleSwap);
  clearBtn.addEventListener("click", handleClear);
  copyBtn.addEventListener("click", handleCopy);
  speakBtn.addEventListener("click", handleSpeak);
  themeToggle.addEventListener("click", toggleTheme);
  historyToggle.addEventListener("click", () => historyPanel.classList.toggle("hidden"));
  clearHistoryBtn.addEventListener("click", clearHistory);

  // Ctrl/Cmd + Enter shortcut
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleTranslate();
    }
  });
}

// --------- Char counter ---------
function updateCharCount() {
  charCount.textContent = inputText.value.length;
}

// --------- Translate handler ---------
async function handleTranslate() {
  const text = inputText.value.trim();
  if (!text) {
    showToast("Please enter some text first", true);
    inputText.focus();
    return;
  }
  if (sourceLang.value === targetLang.value && sourceLang.value !== "auto") {
    showToast("Source and target are the same", true);
    return;
  }

  setLoading(true);
  outputText.innerHTML = "";

  try {
    const translated = await translateText(text, sourceLang.value, targetLang.value);
    await typeOut(translated);
    outputMeta.textContent = `${sourceLang.value.toUpperCase()} → ${targetLang.value.toUpperCase()}`;
    copyBtn.disabled = false;
    speakBtn.disabled = false;
    saveToHistory({
      original: text,
      translated,
      source: sourceLang.value,
      target: targetLang.value,
    });
  } catch (err) {
    console.error(err);
    outputText.innerHTML = `<span class="placeholder">Translation failed. Please try again.</span>`;
    showToast(err.message || "Something went wrong", true);
  } finally {
    setLoading(false);
  }
}

// --------- API call with mirror fallback ---------
async function translateText(text, source, target) {
  const payload = {
    q: text,
    source: source === "auto" ? "auto" : source,
    target,
    format: "text",
  };

  let lastError;
  for (const endpoint of API_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        lastError = new Error(`API ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (data.translatedText) return data.translatedText;
      lastError = new Error(data.error || "Empty response");
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error("All translation servers unavailable. Try again later.");
}

// --------- Typing animation ---------
function typeOut(text) {
  return new Promise((resolve) => {
    outputText.innerHTML = "";
    const span = document.createElement("span");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    outputText.append(span, cursor);

    let i = 0;
    const speed = Math.max(8, 30 - text.length / 20); // faster for long text
    const tick = () => {
      span.textContent = text.slice(0, i++);
      if (i <= text.length) {
        setTimeout(tick, speed);
      } else {
        cursor.remove();
        resolve();
      }
    };
    tick();
  });
}

// --------- UI state helpers ---------
function setLoading(isLoading) {
  translateBtn.disabled = isLoading;
  spinner.classList.toggle("hidden", !isLoading);
  translateBtn.querySelector(".btn-label").innerHTML = isLoading
    ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Translating…'
    : '<i class="fa-solid fa-wand-magic-sparkles"></i> Translate';
}

// --------- Swap, clear, copy, speak ---------
function handleSwap() {
  // Don't swap "auto" into target
  if (sourceLang.value === "auto") {
    showToast("Select a specific source language to swap", true);
    return;
  }
  const tmpLang = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = tmpLang;

  const translatedText = outputText.textContent.trim();
  const placeholder = outputText.querySelector(".placeholder");
  if (!placeholder && translatedText) {
    const original = inputText.value;
    inputText.value = translatedText;
    outputText.textContent = original;
    updateCharCount();
  }
}

function handleClear() {
  inputText.value = "";
  outputText.innerHTML = '<span class="placeholder">Translation will appear here…</span>';
  outputMeta.textContent = "";
  copyBtn.disabled = true;
  speakBtn.disabled = true;
  updateCharCount();
  inputText.focus();
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(outputText.textContent);
    showToast("Copied Successfully");
  } catch {
    showToast("Copy failed", true);
  }
}

function handleSpeak() {
  if (!("speechSynthesis" in window)) {
    showToast("Speech not supported in this browser", true);
    return;
  }
  const text = outputText.textContent.trim();
  if (!text) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = mapLangForSpeech(targetLang.value);
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang.toLowerCase().startsWith(utter.lang.toLowerCase()));
  if (match) utter.voice = match;
  window.speechSynthesis.speak(utter);
}
function mapLangForSpeech(code) {
  const map = {
    en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE",
    hi: "hi-IN", ml: "ml-IN", ta: "ta-IN", ar: "ar-SA",
    ja: "ja-JP", ko: "ko-KR", zh: "zh-CN",
  };
  return map[code] || code;
}

// --------- Theme ---------
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "light" ? "dark" : "light");
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  themeToggle.innerHTML = theme === "dark"
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// --------- History ---------
function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}
function saveToHistory(entry) {
  const list = getHistory();
  list.unshift({ ...entry, at: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
  renderHistory();
}
function renderHistory() {
  const list = getHistory();
  historyList.innerHTML = "";
  historyEmpty.style.display = list.length ? "none" : "block";

  list.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <div class="history-langs">${item.source} → ${item.target}</div>
      <div class="history-orig">${escapeHtml(truncate(item.original, 120))}</div>
      <div class="history-trans">${escapeHtml(truncate(item.translated, 120))}</div>
    `;
    li.addEventListener("click", () => {
      inputText.value = item.original;
      if (item.source !== "auto") sourceLang.value = item.source;
      targetLang.value = item.target;
      outputText.textContent = item.translated;
      outputMeta.textContent = `${item.source.toUpperCase()} → ${item.target.toUpperCase()}`;
      copyBtn.disabled = false;
      speakBtn.disabled = false;
      updateCharCount();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    historyList.appendChild(li);
  });
}
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast("History cleared");
}

// --------- Utilities ---------
function truncate(str, n) { return str.length > n ? str.slice(0, n) + "…" : str; }
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

let toastTimer;
function showToast(message, isError = false) {
  toast.innerHTML = `<i class="fa-solid ${isError ? "fa-circle-exclamation" : "fa-circle-check"}"></i> ${message}`;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}
