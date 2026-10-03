import type { ClickableTarget } from "./types";

let currentTargets: ClickableTarget[] = [];
let overlayContainer: HTMLDivElement | null = null;

const INTERACTIVE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([type='hidden']):not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[role='button']:not([aria-disabled='true'])",
  "[role='tab']:not([aria-disabled='true'])",
  "[role='checkbox']:not([aria-disabled='true'])",
  "[role='switch']:not([aria-disabled='true'])",
  "[data-clickable='true']",
].join(", ");

/**
 * Checks if an element is visible in the viewport and not obscured.
 */
function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected || el.offsetParent === null) return false;
  const style = window.getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0" ||
    style.pointerEvents === "none"
  ) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width <= 4 || rect.height <= 4) return false;

  // Check if within or reasonably near the visible viewport
  const viewHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewWidth = window.innerWidth || document.documentElement.clientWidth;

  return rect.top < viewHeight && rect.bottom > 0 && rect.left < viewWidth && rect.right > 0;
}

/**
 * Gets a human-readable label for a clickable element.
 */
function getElementLabel(el: HTMLElement): string {
  const aria = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
  if (aria) return aria;
  const title = el.getAttribute("title");
  if (title) return title;
  const placeholder = el.getAttribute("placeholder");
  if (placeholder) return `Input: ${placeholder}`;
  const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 30);
  return el.tagName.toLowerCase();
}

/**
 * Scans the current page DOM for visible interactive targets and registers them.
 */
export function scanClickableTargets(): ClickableTarget[] {
  if (typeof document === "undefined") return [];

  const elements = Array.from(document.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTORS));
  const visible = elements.filter(isElementVisible);

  // Filter out redundant nested elements (e.g. icon inside a button)
  const deduped: HTMLElement[] = [];
  for (const el of visible) {
    // If element is inside another interactive element already in list, skip child
    const parentInteractive = el.parentElement?.closest<HTMLElement>(INTERACTIVE_SELECTORS);
    if (parentInteractive && visible.includes(parentInteractive)) {
      continue;
    }
    deduped.push(el);
  }

  // Sort elements in visual reading order: top-to-bottom, left-to-right
  deduped.sort((a, b) => {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    const yDiff = ra.top - rb.top;
    if (Math.abs(yDiff) > 15) return yDiff;
    return ra.left - rb.left;
  });

  currentTargets = deduped.map((el, idx) => {
    const rect = el.getBoundingClientRect();
    let type: ClickableTarget["type"] = "button";
    const tag = el.tagName.toLowerCase();
    if (tag === "a") type = "link";
    else if (tag === "input" || tag === "textarea") type = "input";
    else if (tag === "select") type = "select";
    else if (el.getAttribute("role") === "tab") type = "tab";

    return {
      id: idx + 1,
      element: el,
      label: getElementLabel(el),
      rect,
      type,
    };
  });

  return currentTargets;
}

/**
 * Renders high-contrast numbered badges over every registered interactive element.
 */
export function renderNumberedBadgesOverlay(): void {
  if (typeof document === "undefined") return;

  const targets = scanClickableTargets();

  if (!overlayContainer) {
    overlayContainer = document.createElement("div");
    overlayContainer.id = "jarvis-numbered-badges-overlay";
    overlayContainer.setAttribute("aria-hidden", "true");
    overlayContainer.style.position = "fixed";
    overlayContainer.style.inset = "0";
    overlayContainer.style.pointerEvents = "none";
    overlayContainer.style.zIndex = "99999";
    document.body.appendChild(overlayContainer);
  }

  overlayContainer.innerHTML = "";

  const fragment = document.createDocumentFragment();

  for (const target of targets) {
    const rect = target.element.getBoundingClientRect();
    const badge = document.createElement("div");
    badge.className = "jarvis-badge-tag";
    badge.innerText = String(target.id);

    // Precise inline coordinates over top-left edge of the element
    const top = Math.max(0, rect.top - 6);
    const left = Math.max(0, rect.left - 6);

    badge.style.position = "fixed";
    badge.style.top = `${top}px`;
    badge.style.left = `${left}px`;
    badge.style.display = "inline-flex";
    badge.style.alignItems = "center";
    badge.style.justifyContent = "center";
    badge.style.minWidth = "20px";
    badge.style.height = "20px";
    badge.style.padding = "0 5px";
    badge.style.borderRadius = "9999px";
    badge.style.backgroundColor = "#7BD3C2"; // Ableo theme signature brand teal
    badge.style.color = "#141817";
    badge.style.fontSize = "11px";
    badge.style.fontFamily = "sans-serif";
    badge.style.fontWeight = "800";
    badge.style.border = "1.5px solid #141817";
    badge.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
    badge.style.pointerEvents = "none";
    badge.style.zIndex = "99999";
    badge.style.transform = "scale(1)";
    badge.style.transition = "transform 0.15s ease-out";

    fragment.appendChild(badge);
  }

  overlayContainer.appendChild(fragment);
}

/**
 * Removes the numbered badges overlay from the DOM.
 */
export function removeNumberedBadgesOverlay(): void {
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
}

/**
 * Highlights a targeted element with a brief animated ring.
 */
function flashElementHighlight(el: HTMLElement): void {
  const originalOutline = el.style.outline;
  const originalOffset = el.style.outlineOffset;
  const originalTransition = el.style.transition;

  el.style.transition = "outline 0.2s ease-in-out, transform 0.2s ease-in-out";
  el.style.outline = "4px solid #7BD3C2";
  el.style.outlineOffset = "2px";
  el.style.transform = "scale(1.02)";

  setTimeout(() => {
    el.style.outline = originalOutline;
    el.style.outlineOffset = originalOffset;
    el.style.transform = "";
    el.style.transition = originalTransition;
  }, 750);
}

/**
 * Clicks a target by its numbered ID.
 */
export function executeClickNumber(id: number): { success: boolean; label?: string } {
  // Re-scan if empty
  if (currentTargets.length === 0) {
    scanClickableTargets();
  }

  const target = currentTargets.find((t) => t.id === id);
  if (!target || !target.element.isConnected) {
    // Try re-scanning one time in case layout shifted
    scanClickableTargets();
    const retry = currentTargets.find((t) => t.id === id);
    if (!retry) return { success: false };
    flashElementHighlight(retry.element);
    retry.element.scrollIntoView({ behavior: "smooth", block: "center" });
    retry.element.focus();
    retry.element.click();
    return { success: true, label: retry.label };
  }

  flashElementHighlight(target.element);
  target.element.scrollIntoView({ behavior: "smooth", block: "center" });
  target.element.focus();
  target.element.click();
  return { success: true, label: target.label };
}

/**
 * Clicks an interactive element by matching text/label.
 */
export function executeClickText(query: string): { success: boolean; label?: string } {
  if (!query) return { success: false };
  const clean = query.toLowerCase().trim();
  scanClickableTargets();

  // Find best match: exact > startsWith > includes
  let match = currentTargets.find((t) => t.label.toLowerCase() === clean);
  if (!match) {
    match = currentTargets.find((t) => t.label.toLowerCase().startsWith(clean));
  }
  if (!match) {
    match = currentTargets.find((t) => t.label.toLowerCase().includes(clean));
  }

  if (match) {
    flashElementHighlight(match.element);
    match.element.scrollIntoView({ behavior: "smooth", block: "center" });
    match.element.focus();
    match.element.click();
    return { success: true, label: match.label };
  }

  return { success: false };
}

/**
 * Opens a job result by its one-based visual position. This shared DOM action
 * also marks the card as active so hand gestures can continue with Save or
 * Select after a voice-directed choice.
 */
export function executeSelectJobCard(position: number): { success: boolean; label?: string } {
  if (typeof document === "undefined" || position < 1) return { success: false };

  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-job-card='true']"));
  const card = cards[position - 1];
  if (!card) return { success: false };

  cards.forEach((item) => item.removeAttribute("data-active-card"));
  card.setAttribute("data-active-card", "true");
  flashElementHighlight(card);
  card.scrollIntoView({ behavior: "smooth", block: "center" });

  const label = card.getAttribute("aria-label") || getElementLabel(card);
  const detailsLink = card.querySelector<HTMLAnchorElement>("a[href*='/jobs/']");
  if (detailsLink) {
    detailsLink.focus();
    detailsLink.click();
  } else {
    card.click();
  }

  return { success: true, label };
}

/**
 * Smoothly scrolls the window in the given direction.
 */
export function executeScroll(direction: "down" | "up" | "top" | "bottom"): void {
  if (typeof window === "undefined") return;

  const delta = Math.round(window.innerHeight * 0.7);

  if (direction === "down") {
    window.scrollBy({ top: delta, behavior: "auto" });
  } else if (direction === "up") {
    window.scrollBy({ top: -delta, behavior: "auto" });
  } else if (direction === "top") {
    window.scrollTo({ top: 0, behavior: "auto" });
  } else if (direction === "bottom") {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
  }
}

/**
 * Searches for an input on the current page, inputs the query, and triggers search.
 */
export function executeSearchQuery(query: string): boolean {
  if (typeof document === "undefined") return false;

  // Search input selectors
  const selectors = [
    'input[type="search"]',
    'input[placeholder*="search" i]',
    'input[placeholder*="role" i]',
    'input[name="q"]',
    'input[name="search"]',
    'input[type="text"]',
  ];

  let input: HTMLInputElement | null = null;
  for (const s of selectors) {
    const found = document.querySelector<HTMLInputElement>(s);
    if (found && isElementVisible(found)) {
      input = found;
      break;
    }
  }

  if (!input) return false;

  flashElementHighlight(input);
  input.focus();
  input.value = query;

  // Dispatch React-compatible events
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  // Check for parent form or submit button
  const form = input.closest("form");
  if (form) {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  } else {
    // Send Enter key
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }),
    );
  }

  return true;
}

/**
 * Types text into the currently active element if it's an input or textarea.
 */
export function executeTypeText(text: string): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;

  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    active.value = active.value ? `${active.value} ${text}` : text;
    active.dispatchEvent(new Event("input", { bubbles: true }));
    active.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  return false;
}

/**
 * Clears the active or primary input field.
 */
export function executeClearInput(): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;

  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    active.value = "";
    active.dispatchEvent(new Event("input", { bubbles: true }));
    active.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  const searchInput = document.querySelector<HTMLInputElement>(
    'input[type="search"], input[placeholder*="search" i]',
  );
  if (searchInput) {
    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    searchInput.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  return false;
}

/**
 * Extracts clean, readable text from the main page content for text-to-speech.
 */
export function readMainPageContent(): string {
  if (typeof document === "undefined") return "";

  const main = document.getElementById("main") || document.querySelector("main") || document.body;
  if (!main) return "";

  // Clone to avoid modifying DOM
  const clone = main.cloneNode(true) as HTMLElement;

  // Remove script, style, svg, hidden elements
  const toRemove = clone.querySelectorAll(
    "script, style, svg, noscript, [aria-hidden='true'], #jarvis-numbered-badges-overlay, nav, footer",
  );
  toRemove.forEach((el) => el.remove());

  const text = (clone.innerText || clone.textContent || "")
    .replace(/\s+/g, " ")
    .replace(/\[\d+\]/g, "") // remove badge tags
    .trim();

  return text.slice(0, 2000);
}
