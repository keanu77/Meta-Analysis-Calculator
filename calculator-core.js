// Meta-Analysis Calculator JavaScript
// Version 1.0

// Configuration
const DEV_MODE = false;
const DEBUG_EVENTS = false;

// HTML escape utility to prevent XSS
function escapeHTML(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Global variables
let currentTab = "module-guide"; // Start with guide tab
let calculationHistory = [];

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeTabs();
  initializeFormulas();
  initializeMobileOptimization();
  initializeEventHandlers();
});

// Mobile Optimization
function initializeMobileOptimization() {
  // Detect mobile device
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (isMobile || isTouch) {
    document.body.classList.add("mobile-device");
    setupMobileFeatures();
  }

  // Handle viewport changes
  handleViewportChanges();

  // Setup responsive tables
  setupResponsiveTables();
}

function setupMobileFeatures() {
  // Add swipe gestures for tabs
  let touchStartX = 0;
  let touchEndX = 0;

  const tabContainer = document.querySelector(".nav-tabs");
  if (tabContainer) {
    tabContainer.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true },
    );

    tabContainer.addEventListener(
      "touchend",
      function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      },
      { passive: true },
    );
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      const tabs = document.querySelectorAll(".nav-tab");
      const currentIndex = Array.from(tabs).findIndex((tab) =>
        tab.classList.contains("active"),
      );

      if (diff > 0 && currentIndex < tabs.length - 1) {
        // Swipe left - next tab
        tabs[currentIndex + 1].click();
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - previous tab
        tabs[currentIndex - 1].click();
      }
    }
  }

  // Improve form input focus behavior
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      // Scroll input into view with some padding
      setTimeout(() => {
        this.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    });
  });

  // Add touch feedback to buttons
  const buttons = document.querySelectorAll("button, .btn, .rob-btn");
  buttons.forEach((button) => {
    button.addEventListener(
      "touchstart",
      function () {
        this.classList.add("touch-active");
      },
      { passive: true },
    );

    button.addEventListener(
      "touchend",
      function () {
        setTimeout(() => {
          this.classList.remove("touch-active");
        }, 100);
      },
      { passive: true },
    );
  });
}

function handleViewportChanges() {
  // Adjust for viewport changes (keyboard, orientation)
  let viewportHeight = window.innerHeight;

  window.addEventListener("resize", function () {
    const newHeight = window.innerHeight;

    // Detect if keyboard is shown (viewport shrinks significantly)
    if (newHeight < viewportHeight * 0.75) {
      document.body.classList.add("keyboard-visible");
    } else {
      document.body.classList.remove("keyboard-visible");
    }

    viewportHeight = newHeight;
  });

  // Handle orientation changes
  window.addEventListener("orientationchange", function () {
    setTimeout(() => {
      // Recalculate layouts after orientation change
      if (window.currentChart) {
        window.currentChart.resize();
      }
    }, 300);
  });
}

function setupResponsiveTables() {
  // Wrap all tables in responsive containers
  const tables = document.querySelectorAll("table:not(.already-wrapped)");

  tables.forEach((table) => {
    if (!table.closest(".table-responsive")) {
      const wrapper = document.createElement("div");
      wrapper.className = "table-responsive scrollable-container";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      table.classList.add("already-wrapped");
    }
  });

  // Add horizontal scroll indicators
  const responsiveTables = document.querySelectorAll(".table-responsive");
  responsiveTables.forEach((container) => {
    container.addEventListener("scroll", function () {
      const maxScroll = this.scrollWidth - this.clientWidth;
      if (this.scrollLeft > 0) {
        this.classList.add("scrolled-left");
      } else {
        this.classList.remove("scrolled-left");
      }

      if (this.scrollLeft < maxScroll - 1) {
        this.classList.add("can-scroll-right");
      } else {
        this.classList.remove("can-scroll-right");
      }
    });

    // Initial check
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll > 0) {
      container.classList.add("can-scroll-right");
    }
  });
}

// Tab Management
function initializeTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const targetTab = button.getAttribute("data-tab");
      switchTab(targetTab);
    });
  });

  // 鍵盤導航：左右方向鍵切換 tab
  const tabList = document.querySelector('[role="tablist"]');
  if (tabList) {
    tabList.addEventListener("keydown", (e) => {
      const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
      const currentIndex = tabs.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      let newIndex;
      if (e.key === "ArrowRight") {
        newIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        newIndex = 0;
      } else if (e.key === "End") {
        newIndex = tabs.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      tabs[newIndex].focus();
      tabs[newIndex].click();
    });
  }
}

function switchTab(tabId) {
  // Update tab buttons + ARIA
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
    btn.setAttribute("tabindex", "-1");
  });
  const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
  activeBtn.classList.add("active");
  activeBtn.setAttribute("aria-selected", "true");
  activeBtn.setAttribute("tabindex", "0");

  // Update tab contents
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(tabId).classList.add("active");

  currentTab = tabId;
}

// Unified Event Handling System
function initializeEventHandlers() {
  document.removeEventListener("click", handleGlobalClick);
  document.addEventListener("click", handleGlobalClick);
}

function handleGlobalClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  event.preventDefault();
  event.stopPropagation();

  const action = button.getAttribute("data-action");
  const index = button.getAttribute("data-index");

  if (DEBUG_EVENTS) {
    console.log("🔥 Global click handler triggered:", {
      action,
      index,
      button: button.outerHTML,
    });
  }

  try {
    switch (action) {
      // Management actions (no index required)
      case "clear-all-studies":
        if (DEBUG_EVENTS) console.log("🗑️ Button clicked: clear-all-studies");
        clearAllStudies();
        if (DEBUG_EVENTS) console.log("🗑️ clearAllStudies() call completed");
        break;

      case "load-demo-data":
        if (DEBUG_EVENTS) console.log("🧪 Calling loadDemoData()");
        loadDemoData();
        break;

      case "export-studies":
        if (DEBUG_EVENTS) console.log("💾 Calling exportStudies()");
        exportStudies();
        break;

      case "import-studies":
        console.log("Triggering file import");
        const fileInput = document.getElementById("import-file");
        if (fileInput) fileInput.click();
        break;

      // Study actions (index required)
      case "edit":
      case "duplicate":
      case "delete":
        if (DEBUG_EVENTS)
          console.log("🔍 Raw index value:", index, "type:", typeof index);
        const studyIndex = parseInt(index, 10);
        if (DEBUG_EVENTS)
          console.log(
            "🔍 Parsed index value:",
            studyIndex,
            "isNaN:",
            isNaN(studyIndex),
          );

        if (isNaN(studyIndex) || studyIndex < 0) {
          console.error(
            "Invalid study index for action:",
            action,
            "raw:",
            index,
            "parsed:",
            studyIndex,
          );
          alert("無效的研究索引: " + index);
          return;
        }

        if (!robSystem) {
          console.error("robSystem not initialized");
          alert("系統未初始化，請重新載入頁面");
          return;
        }

        console.log(
          `Calling robSystem action: ${action} with index:`,
          studyIndex,
        );

        switch (action) {
          case "edit":
            robSystem.editStudy(studyIndex);
            break;
          case "duplicate":
            robSystem.duplicateStudy(studyIndex);
            break;
          case "delete":
            if (DEBUG_EVENTS)
              console.log(
                "🗑️ Calling robSystem.deleteStudy with index:",
                studyIndex,
              );
            robSystem.deleteStudy(studyIndex);
            break;
        }
        break;

      default:
        console.warn("Unknown action:", action);
    }
  } catch (error) {
    console.error("Error handling click action:", error);
    alert(`執行操作時出現錯誤: ${error.message}`);
  }
}

// Utility Functions
// =============================================================================

// Critical value functions
function getCriticalValueZ(ciLevel) {
  const alpha = (100 - ciLevel) / 100;
  switch (ciLevel) {
    case 90:
      return 1.645;
    case 95:
      return 1.96;
    case 99:
      return 2.576;
    default:
      return 1.96; // Default to 95%
  }
}

function getCriticalValueT(ciLevel, df) {
  // Complete t-table lookup for accurate calculations
  // Using two-tailed critical values
  const alpha = (100 - ciLevel) / 100 / 2;

  // For large samples (df >= 120), use Z distribution
  if (df >= 120) return getCriticalValueZ(ciLevel);

  // Extended t-table with correct values for common confidence levels
  const tTable = {
    // df: { alpha 0.05 (90% CI), 0.025 (95% CI), 0.005 (99% CI) }
    1: { 0.05: 6.314, 0.025: 12.706, 0.005: 63.657 },
    2: { 0.05: 2.92, 0.025: 4.303, 0.005: 9.925 },
    3: { 0.05: 2.353, 0.025: 3.182, 0.005: 5.841 },
    4: { 0.05: 2.132, 0.025: 2.776, 0.005: 4.604 },
    5: { 0.05: 2.015, 0.025: 2.571, 0.005: 4.032 },
    6: { 0.05: 1.943, 0.025: 2.447, 0.005: 3.707 },
    7: { 0.05: 1.895, 0.025: 2.365, 0.005: 3.499 },
    8: { 0.05: 1.86, 0.025: 2.306, 0.005: 3.355 },
    9: { 0.05: 1.833, 0.025: 2.262, 0.005: 3.25 },
    10: { 0.05: 1.812, 0.025: 2.228, 0.005: 3.169 },
    11: { 0.05: 1.796, 0.025: 2.201, 0.005: 3.106 },
    12: { 0.05: 1.782, 0.025: 2.179, 0.005: 3.055 },
    13: { 0.05: 1.771, 0.025: 2.16, 0.005: 3.012 },
    14: { 0.05: 1.761, 0.025: 2.145, 0.005: 2.977 },
    15: { 0.05: 1.753, 0.025: 2.131, 0.005: 2.947 },
    16: { 0.05: 1.746, 0.025: 2.12, 0.005: 2.921 },
    17: { 0.05: 1.74, 0.025: 2.11, 0.005: 2.898 },
    18: { 0.05: 1.734, 0.025: 2.101, 0.005: 2.878 },
    19: { 0.05: 1.729, 0.025: 2.093, 0.005: 2.861 },
    20: { 0.05: 1.725, 0.025: 2.086, 0.005: 2.845 },
    21: { 0.05: 1.721, 0.025: 2.08, 0.005: 2.831 },
    22: { 0.05: 1.717, 0.025: 2.074, 0.005: 2.819 },
    23: { 0.05: 1.714, 0.025: 2.069, 0.005: 2.807 },
    24: { 0.05: 1.711, 0.025: 2.064, 0.005: 2.797 },
    25: { 0.05: 1.708, 0.025: 2.06, 0.005: 2.787 },
    26: { 0.05: 1.706, 0.025: 2.056, 0.005: 2.779 },
    27: { 0.05: 1.703, 0.025: 2.052, 0.005: 2.771 },
    28: { 0.05: 1.701, 0.025: 2.048, 0.005: 2.763 },
    29: { 0.05: 1.699, 0.025: 2.045, 0.005: 2.756 },
    30: { 0.05: 1.697, 0.025: 2.042, 0.005: 2.75 },
    35: { 0.05: 1.69, 0.025: 2.03, 0.005: 2.724 },
    40: { 0.05: 1.684, 0.025: 2.021, 0.005: 2.704 },
    45: { 0.05: 1.679, 0.025: 2.014, 0.005: 2.69 },
    50: { 0.05: 1.676, 0.025: 2.009, 0.005: 2.678 },
    55: { 0.05: 1.673, 0.025: 2.004, 0.005: 2.668 },
    60: { 0.05: 1.671, 0.025: 2.0, 0.005: 2.66 },
    65: { 0.05: 1.669, 0.025: 1.997, 0.005: 2.654 },
    66: { 0.05: 1.668, 0.025: 1.997, 0.005: 2.652 },
    67: { 0.05: 1.668, 0.025: 1.996, 0.005: 2.651 },
    68: { 0.05: 1.668, 0.025: 1.995, 0.005: 2.65 },
    69: { 0.05: 1.667, 0.025: 1.995, 0.005: 2.649 },
    70: { 0.05: 1.667, 0.025: 1.994, 0.005: 2.648 },
    75: { 0.05: 1.665, 0.025: 1.992, 0.005: 2.643 },
    80: { 0.05: 1.664, 0.025: 1.99, 0.005: 2.639 },
    85: { 0.05: 1.663, 0.025: 1.988, 0.005: 2.635 },
    90: { 0.05: 1.662, 0.025: 1.987, 0.005: 2.632 },
    95: { 0.05: 1.661, 0.025: 1.985, 0.005: 2.629 },
    100: { 0.05: 1.66, 0.025: 1.984, 0.005: 2.626 },
    110: { 0.05: 1.659, 0.025: 1.982, 0.005: 2.621 },
    120: { 0.05: 1.658, 0.025: 1.98, 0.005: 2.617 },
  };

  // Find closest df value or interpolate
  const dfValues = Object.keys(tTable)
    .map(Number)
    .sort((a, b) => a - b);

  // Exact match
  if (tTable[df]) {
    return tTable[df][alpha] || getCriticalValueZ(ciLevel);
  }

  // Find closest value for interpolation
  let lowerDf = dfValues[0];
  let upperDf = dfValues[dfValues.length - 1];

  for (let i = 0; i < dfValues.length - 1; i++) {
    if (dfValues[i] <= df && dfValues[i + 1] >= df) {
      lowerDf = dfValues[i];
      upperDf = dfValues[i + 1];
      break;
    }
  }

  // If df is out of range, use closest value
  if (df < lowerDf) {
    return tTable[lowerDf][alpha] || getCriticalValueZ(ciLevel);
  }
  if (df > upperDf) {
    return tTable[upperDf][alpha] || getCriticalValueZ(ciLevel);
  }

  // Linear interpolation between two closest values
  const lowerValue = tTable[lowerDf][alpha];
  const upperValue = tTable[upperDf][alpha];
  const ratio = (df - lowerDf) / (upperDf - lowerDf);
  const interpolatedValue = lowerValue + ratio * (upperValue - lowerValue);

  return interpolatedValue || getCriticalValueZ(ciLevel);
}

function getQuantileNormal(p, n) {
  // Simplified normal quantile function
  // For meta-analysis, we typically use standard values
  if (p === 0.75) return 0.6745; // Approximately
  return 0.6745; // Default
}

// Normal CDF approximation
function normalCDF(x) {
  // Approximation of the standard normal CDF
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Display and utility functions
function displayResult(resultDiv, text) {
  resultDiv.textContent = text;
  resultDiv.classList.add("has-result");
  resultDiv.classList.remove("has-error");
}

function showError(resultDiv, message) {
  resultDiv.textContent = message;
  resultDiv.classList.add("has-error");
  resultDiv.classList.remove("has-result");
}

function addToHistory(result) {
  calculationHistory.push({
    timestamp: new Date(),
    ...result,
  });
}

// Export functions for potential future use
function exportHistory() {
  const dataStr = JSON.stringify(calculationHistory, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = "meta_analysis_calculations.json";
  link.click();
}

// Initialize tooltips or help system if needed
function initializeHelp() {
  // Add event listeners for help icons, tooltips, etc.
  // This would be expanded based on UI requirements
}

// Method accordion toggle function for statistics module
function toggleMethod(methodId) {
  const content = document.getElementById(methodId);

  if (!content) {
    console.error("Method content not found:", methodId);
    return;
  }

  const header = content.previousElementSibling;
  if (!header) {
    console.error("Method header not found for:", methodId);
    return;
  }

  const icon = header.querySelector("i:last-child");
  if (!icon) {
    console.error("Method icon not found for:", methodId);
    return;
  }

  // Close all other method contents in the same container
  const container = content.closest(".tab-content") || document;
  container.querySelectorAll(".method-content").forEach(function (el) {
    if (el !== content && el.classList.contains("active")) {
      el.classList.remove("active");
      const otherHeader = el.previousElementSibling;
      if (otherHeader) {
        const otherIcon = otherHeader.querySelector("i:last-child");
        if (otherIcon) {
          otherIcon.classList.remove("fa-chevron-up");
          otherIcon.classList.add("fa-chevron-down");
        }
      }
    }
  });

  // Toggle current content
  content.classList.toggle("active");

  // Toggle icon
  if (content.classList.contains("active")) {
    icon.classList.remove("fa-chevron-down");
    icon.classList.add("fa-chevron-up");
  } else {
    icon.classList.remove("fa-chevron-up");
    icon.classList.add("fa-chevron-down");
  }
}

function toggleHelp(helpId) {
  const content = document.getElementById(helpId);
  const header = content.previousElementSibling;
  const icon = header.querySelector("i:last-child");

  // Close all other help contents
  document.querySelectorAll(".help-content").forEach((el) => {
    if (el !== content && el.classList.contains("active")) {
      el.classList.remove("active");
      const otherIcon = el.previousElementSibling.querySelector("i:last-child");
      otherIcon.classList.remove("fa-chevron-up");
      otherIcon.classList.add("fa-chevron-down");
    }
  });

  // Toggle current content
  content.classList.toggle("active");

  // Toggle icon
  if (content.classList.contains("active")) {
    icon.classList.remove("fa-chevron-down");
    icon.classList.add("fa-chevron-up");
  } else {
    icon.classList.remove("fa-chevron-up");
    icon.classList.add("fa-chevron-down");
  }
}

// Initialize RoB system when page loads
document.addEventListener("DOMContentLoaded", function () {
  try {
    if (
      typeof robSystem !== "undefined" &&
      document.getElementById("studies-container")
    ) {
      robSystem.renderStudiesList();
    }
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});
