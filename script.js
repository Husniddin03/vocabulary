// Sample vocabulary data
// Sample vocabulary data (loaded from vocabulary.txt)
let sampleData = "";

// Fetch vocabulary.txt synchronously before initializing the app
fetch("vocabulary.txt")
  .then((response) => response.text())
  .then((text) => {
    sampleData = text;
    // Initialize the app after loading the sample data
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })
  .catch((error) => {
    console.error("Error loading vocabulary.txt:", error);
    // Fallback: initialize with empty data
    sampleData = "";
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  });

// Global variables
let vocabulary = [];
let filteredVocabulary = [];
let currentTheme = localStorage.getItem("theme") || "light";

// DOM elements
const elements = {
  themeToggle: document.getElementById("themeToggle"),
  fileInput: document.getElementById("fileInput"),
  resetBtn: document.getElementById("resetBtn"),
  searchInput: document.getElementById("searchInput"),
  levelFilter: document.getElementById("levelFilter"),
  posFilter: document.getElementById("posFilter"),
  vocabularyGrid: document.getElementById("vocabularyGrid"),
  resultsCount: document.getElementById("resultsCount"),
  loading: document.getElementById("loading"),
  emptyState: document.getElementById("emptyState"),
};

// Initialize the application
function init() {
  // Set initial theme
  document.documentElement.setAttribute("data-theme", currentTheme);

  // Load sample data
  loadVocabulary(sampleData);

  // Add event listeners
  addEventListeners();
}

// Add all event listeners
function addEventListeners() {
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.fileInput.addEventListener("change", handleFileUpload);
  elements.resetBtn.addEventListener("click", resetToSample);
  elements.searchInput.addEventListener("input", debounce(handleSearch, 300));
  elements.levelFilter.addEventListener("change", handleFilter);
  elements.posFilter.addEventListener("change", handleFilter);
}

// Theme toggle functionality
function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  localStorage.setItem("theme", currentTheme);
}

// Parse vocabulary data from text
function parseVocabulary(text) {
  const lines = text.trim().split("\n");
  return lines
    .map((line) => {
      const parts = line.split(" - ");
      if (parts.length >= 6) {
        return {
          english: parts[0].trim(),
          partOfSpeech: parts[1].trim(),
          level: parts[2].trim(),
          uzbek: parts[3].trim(),
          uzbekPartOfSpeech: parts[4].trim(),
          englishExample: parts[5].trim(),
          uzbekExample: parts[6]?.trim() || "",
        };
      }
      return null;
    })
    .filter(Boolean);
}

// Load vocabulary data
function loadVocabulary(data) {
  showLoading(true);

  setTimeout(() => {
    vocabulary = parseVocabulary(data);
    filteredVocabulary = [...vocabulary];
    updateFilters();
    renderVocabulary();
    updateResultsCount();
    showLoading(false);
  }, 500);
}

// Handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file && file.type === "text/plain") {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      loadVocabulary(content);
    };
    reader.readAsText(file);
  } else if (file) {
    alert("Please select a valid text file (.txt)");
  }
}

// Reset to sample data
function resetToSample() {
  elements.fileInput.value = "";
  elements.searchInput.value = "";
  elements.levelFilter.value = "all";
  elements.posFilter.value = "all";
  loadVocabulary(sampleData);
}

// Handle search
function handleSearch() {
  filterVocabulary();
}

// Handle filter changes
function handleFilter() {
  filterVocabulary();
}

// Filter vocabulary based on search and filters
function filterVocabulary() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const selectedLevel = elements.levelFilter.value;
  const selectedPos = elements.posFilter.value;

  filteredVocabulary = vocabulary.filter((item) => {
    const matchesSearch =
      item.english.toLowerCase().includes(searchTerm) ||
      item.uzbek.toLowerCase().includes(searchTerm) ||
      item.englishExample.toLowerCase().includes(searchTerm) ||
      item.uzbekExample.toLowerCase().includes(searchTerm);

    const matchesLevel =
      selectedLevel === "all" || item.level === selectedLevel;
    const matchesPos =
      selectedPos === "all" || item.partOfSpeech === selectedPos;

    return matchesSearch && matchesLevel && matchesPos;
  });

  renderVocabulary();
  updateResultsCount();
}

// Update filter options
function updateFilters() {
  // Update level filter
  const levels = [...new Set(vocabulary.map((item) => item.level))].sort();
  elements.levelFilter.innerHTML = '<option value="all">All Levels</option>';
  levels.forEach((level) => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = level.toUpperCase();
    elements.levelFilter.appendChild(option);
  });

  // Update part of speech filter
  const partsOfSpeech = [
    ...new Set(vocabulary.map((item) => item.partOfSpeech)),
  ].sort();
  elements.posFilter.innerHTML =
    '<option value="all">All Parts of Speech</option>';
  partsOfSpeech.forEach((pos) => {
    const option = document.createElement("option");
    option.value = pos;
    option.textContent = pos;
    elements.posFilter.appendChild(option);
  });
}

// Render vocabulary cards
function renderVocabulary() {
  if (filteredVocabulary.length === 0) {
    elements.vocabularyGrid.style.display = "none";
    elements.emptyState.style.display = "block";
    return;
  }

  elements.vocabularyGrid.style.display = "grid";
  elements.emptyState.style.display = "none";

  let vocabularyCount = 1;
  elements.vocabularyGrid.innerHTML = filteredVocabulary
    .map(
      (item) => `
        <div class="vocabulary-card">
            <div class="word-header">
                <div class="word-info">
                    <div class="word-title">
                        <h3>${escapeHtml(item.english)}</h3>
                        <button class="speak-btn" onclick="speakWord('${escapeHtml(
                          item.english
                        )}', 'en')" aria-label="Pronounce word">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                        </button>
                        ${vocabularyCount++}
                    </div>
                    <div class="word-tags">
                        <span class="tag tag-pos">${escapeHtml(
                          item.partOfSpeech
                        )}</span>
                        <span class="tag tag-level">${escapeHtml(
                          item.level.toUpperCase()
                        )}</span>
                    </div>
                </div>
            </div>
            
            <div class="translation">
                <div class="translation-title">
                    <h4>${escapeHtml(item.uzbek)}</h4>
                    <button class="speak-btn" onclick="speakWord('${escapeHtml(
                      item.uzbek
                    )}', 'uz')" aria-label="Pronounce translation">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                    </button>
                </div>
                <p class="translation-pos">${escapeHtml(
                  item.uzbekPartOfSpeech
                )}</p>
            </div>
            
            <div class="examples">
                <div class="example example-en">
                    <p class="example-label">Example:</p>
                    <p class="example-text">"${escapeHtml(
                      item.englishExample
                    )}"</p>
                </div>
                ${
                  item.uzbekExample
                    ? `
                    <div class="example example-uz">
                        <p class="example-label">Tarjima:</p>
                        <p class="example-text">"${escapeHtml(
                          item.uzbekExample
                        )}"</p>
                    </div>
                `
                    : ""
                }
            </div>
        </div>
    `
    )
    .join("");
}

// Update results count
function updateResultsCount() {
  elements.resultsCount.textContent = `Showing ${filteredVocabulary.length} of ${vocabulary.length} words`;
}

// Show/hide loading state
function showLoading(show) {
  elements.loading.style.display = show ? "flex" : "none";
}

// Text-to-speech functionality
function speakWord(text, lang) {
  if ("speechSynthesis" in window) {
    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "en" ? "en-US" : "uz-UZ";
    utterance.rate = 0.8;
    utterance.volume = 0.8;

    // Handle errors gracefully
    utterance.onerror = (event) => {
      console.warn("Speech synthesis error:", event.error);
    };

    speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser");
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// Handle visibility change to pause speech when tab is not active
document.addEventListener("visibilitychange", () => {
  if (document.hidden && "speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
});
