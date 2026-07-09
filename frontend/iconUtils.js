import {loadCSSFromURLAsync} from '@airtable/blocks/ui';
import 'boxicons/css/boxicons.min.css';

const BOXICONS_CSS_URL = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';

// The bundler doesn't resolve the font files referenced by the bundled
// boxicons CSS, so the font itself has to come from the CDN. Everything that
// depends on the icons being available can await this promise.
let cssLoaded = false;
export const boxiconsCssLoaded = loadCSSFromURLAsync(BOXICONS_CSS_URL)
    .then(() => {
        cssLoaded = true;
    })
    .catch((e) => console.error('[Atlas] Failed to load the boxicons stylesheet:', e));

// Safe text
export function escapeHTML(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// --- Fast glyph check with memoization -------------------------------------
const glyphCache = new Map();

// Does the class render a ::before glyph right now?
function probeGlyph(iconClass) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden;";
    const i = document.createElement("i");
    i.className = `bx ${iconClass}`;
    i.style.cssText = "display:inline-block;font-size:24px;";
    wrap.appendChild(i);
    document.body.appendChild(wrap);
    const cs = getComputedStyle(i, "::before");
    const raw = cs && cs.content ? cs.content : "";
    document.body.removeChild(wrap);
    const content = raw.replace(/^['"]|['"]$/g, "");
    return !!content && content !== "normal" && content !== "none";
}

// Does a Boxicons class (e.g., "bx-home"/"bxs-map") render a glyph?
export function hasBoxiconGlyph(iconClass) {
    if (!iconClass) return false;
    if (glyphCache.has(iconClass)) return glyphCache.get(iconClass);
    const ok = probeGlyph(iconClass);
    // Don't cache misses while the stylesheet may still be loading — a check
    // that runs too early would otherwise stick as a false negative forever.
    if (ok || cssLoaded) glyphCache.set(iconClass, ok);
    return ok;
}

// Resolve the best icon class WITHOUT changing the stored value.
// SOLID FIRST for bare names. Returns "bx bxs-..." / "bx bx-..." or null for fallback.
//
// Fail-open: while the stylesheet may still be loading, the glyph probe can't
// tell "unknown icon" from "not loaded yet" — in that case trust the name and
// return the class optimistically instead of forcing the fallback pin.
export function resolveBoxiconClass(raw) {
    const s = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!s) return null;

    // Already prefixed?
    if (s.startsWith("bx-") || s.startsWith("bxs-") || s.startsWith("bxl-")) {
        if (hasBoxiconGlyph(s)) return `bx ${s}`;
        return cssLoaded ? null : `bx ${s}`;
    }

    // Bare name: try SOLID first, then normal
    const solid = `bxs-${s}`;
    const normal = `bx-${s}`;
    if (hasBoxiconGlyph(solid)) return `bx ${solid}`;
    if (hasBoxiconGlyph(normal)) return `bx ${normal}`;
    return cssLoaded ? null : `bx ${solid}`;
}

// --- Complete icon list (for the picker) ------------------------------------
let allIconNamesCache = null;

const ICON_RULE_RE = /\.((?:bx|bxs|bxl)-[\w-]+)::?before/g;

// Read the icon classes from readable (same-origin) stylesheets
function namesFromStyleSheets() {
    const names = new Set();
    for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try {
            rules = sheet.cssRules;
        } catch {
            continue; // cross-origin stylesheet, not readable
        }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
            const selector = rule.selectorText;
            if (!selector) continue;
            for (const part of selector.split(',')) {
                const m = part.trim().match(/^\.((?:bx|bxs|bxl)-[\w-]+)::?before$/);
                if (m) names.add(m[1]);
            }
        }
    }
    return [...names].sort();
}

function namesFromCssText(cssText) {
    const names = new Set();
    let match;
    while ((match = ICON_RULE_RE.exec(cssText)) !== null) {
        names.add(match[1]);
    }
    ICON_RULE_RE.lastIndex = 0;
    return [...names].sort();
}

/**
 * Every Boxicons icon name (e.g. "bx-home", "bxs-map", "bxl-github").
 * Async: waits for the stylesheet, reads it via cssRules when it's
 * same-origin, and falls back to fetching the CSS text when it isn't
 * (cssRules of cross-origin stylesheets aren't readable).
 */
export async function getAllBoxiconNames() {
    if (allIconNamesCache) return allIconNamesCache;
    await boxiconsCssLoaded;
    let names = namesFromStyleSheets();
    if (!names.length) {
        try {
            const response = await fetch(BOXICONS_CSS_URL);
            names = namesFromCssText(await response.text());
        } catch (e) {
            console.error('[Atlas] Failed to fetch the boxicons stylesheet:', e);
            names = [];
        }
    }
    if (names.length) allIconNamesCache = names;
    return names;
}
