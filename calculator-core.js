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

// Pages with at least this many section headings get an in-page table of contents.
const TOC_MIN_SECTIONS = 3;

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeTabs();
  initializeFormulas();
  setupResponsiveTables();
  buildPageTocs();
  initializeResultControls();
  openFromHash();
  window.addEventListener("hashchange", openFromHash);
});

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
  document.querySelectorAll(".tab-content").forEach((panel) => {
    panel.setAttribute("role", "tabpanel");
  });

  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      switchTab(button.getAttribute("data-tab"), { updateUrl: true });
    });
  });

  // Links and buttons elsewhere on the page that open a tab (home entry cards, brand).
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-goto]");
    if (!trigger) return;
    event.preventDefault();
    switchTab(trigger.getAttribute("data-goto"), { updateUrl: true });
    document.querySelector(`.tab-btn[data-tab="${trigger.getAttribute("data-goto")}"]`)?.focus({ preventScroll: true });
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

function switchTab(tabId, { updateUrl = false, keepScroll = false } = {}) {
  const panel = document.getElementById(tabId);
  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (!panel || !activeBtn) return;

  // Update tab buttons + ARIA
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
    btn.setAttribute("tabindex", "-1");
  });
  activeBtn.classList.add("active");
  activeBtn.setAttribute("aria-selected", "true");
  activeBtn.setAttribute("tabindex", "0");
  activeBtn.scrollIntoView({ block: "nearest", inline: "nearest" });

  // Update tab contents
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  panel.classList.add("active");
  currentTab = tabId;

  if (updateUrl) history.replaceState(null, "", `#${tabId}`);
  // A new page starts at its top instead of the previous page's scroll position.
  const main = document.getElementById("main-content");
  if (!keepScroll && main && window.scrollY > main.offsetTop) {
    window.scrollTo({ top: main.offsetTop, behavior: "auto" });
  }
}

// Open the tab (or the section inside a tab) named by the URL hash.
function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target) return;
  const panel = target.classList.contains("tab-content") ? target : target.closest(".tab-content");
  if (!panel) return;
  switchTab(panel.id, { keepScroll: target !== panel });
  if (target !== panel) target.scrollIntoView();
}

// In-page table of contents built from each page's section headings.
function buildPageTocs() {
  document.querySelectorAll(".tab-content").forEach((panel) => {
    if (panel.id === "module-guide") return;
    const headings = Array.from(panel.querySelectorAll("h3")).filter(
      (heading) => !heading.closest(".usage-guide"),
    );
    if (headings.length < TOC_MIN_SECTIONS) return;

    const toc = document.createElement("nav");
    toc.className = "page-toc";
    toc.setAttribute("aria-label", "本頁內容");
    const label = document.createElement("span");
    label.className = "page-toc-label";
    label.textContent = "本頁內容";
    toc.append(label);
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `${panel.id}-section-${index + 1}`;
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent.trim();
      toc.append(link);
    });
    const header = panel.querySelector(".module-header");
    if (header) header.after(toc);
    else panel.prepend(toc);
  });
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
