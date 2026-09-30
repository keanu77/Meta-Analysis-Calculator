// Meta-Analysis Calculator JavaScript
// Version 1.0

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

  initializeResultControls();
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

// Utility Functions
// =============================================================================

// Read the complete numeric value: do not truncate fractional sample sizes.
function readNumber(id) {
  const raw = document.getElementById(id).value.trim();
  return raw === "" ? NaN : Number(raw);
}

function isSampleSize(value, minimum = 1) {
  return Number.isSafeInteger(value) && value >= minimum;
}

function allFinite(...values) {
  return values.every(Number.isFinite);
}

// Echo inputs/intermediates in calculation steps without float noise (0.1² → 0.01).
function fmt(value) {
  return Number.isFinite(value) ? String(Number(value.toPrecision(10))) : String(value);
}

function formatP(p) {
  return p < 0.0001 ? "< 0.0001" : p.toFixed(4);
}

function initializeResultControls() {
  document.querySelectorAll(".result-box").forEach((box) => {
    const output = document.createElement("span");
    output.className = "result-text";
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy-btn";
    copy.textContent = "複製";
    copy.setAttribute("aria-label", "複製計算結果");
    const status = document.createElement("span");
    status.className = "copy-status";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(output.textContent);
        status.textContent = "已複製";
      } catch {
        status.textContent = "無法自動複製，請選取結果文字後複製。";
      }
    });
    box.append(output, copy, status);
  });
}

function setResultText(resultDiv, text) {
  const output = resultDiv.querySelector(".result-text");
  if (output) output.textContent = text;
  else resultDiv.textContent = text;
  const status = resultDiv.querySelector(".copy-status");
  if (status) status.textContent = "";
}

// Display text only, with a final guard for numerical overflow.
function displayResult(resultDiv, text) {
  if (/\b(?:NaN|Infinity)\b/.test(text)) {
    showError(resultDiv, "數值超出可計算範圍，請檢查輸入資料。");
    return;
  }
  setResultText(resultDiv, text);
  resultDiv.classList.add("has-result");
  resultDiv.classList.remove("has-error");
}

function showError(resultDiv, message) {
  setResultText(resultDiv, message);
  resultDiv.classList.add("has-error");
  resultDiv.classList.remove("has-result");
}

function addToHistory(result) {
  const valid = (value) => typeof value === "number"
    ? Number.isFinite(value)
    : Array.isArray(value) ? value.every(valid)
    : value && typeof value === "object" ? Object.values(value).every(valid) : true;
  if (!valid(result.outputs)) return;
  calculationHistory.push({ timestamp: new Date(), ...result });
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
