import 'boxicons/css/boxicons.min.css';

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

// Does a Boxicons class (e.g., "bx-home"/"bxs-map") render a glyph?
export function hasBoxiconGlyph(iconClass) {
    if (!iconClass) return false;
    if (glyphCache.has(iconClass)) return glyphCache.get(iconClass);

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
    const ok = !!content && content !== "normal" && content !== "none";
    glyphCache.set(iconClass, ok);
    return ok;
}

let allIconNamesCache = null;

// Every Boxicons icon name (e.g. "bx-home", "bxs-map", "bxl-github"),
// extracted from the loaded stylesheet so the list is always complete.
export function getAllBoxiconNames() {
    if (allIconNamesCache) return allIconNamesCache;
    const names = new Set();
    for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try {
            rules = sheet.cssRules;
        } catch {
            continue; // cross-origin stylesheet
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
    const sorted = [...names].sort();
    if (sorted.length) allIconNamesCache = sorted; // only cache once the CSS is loaded
    return sorted;
}

// Resolve the best icon class WITHOUT changing the stored value.
// SOLID FIRST for bare names. Returns "bx bxs-..." / "bx bx-..." or null for fallback.
export function resolveBoxiconClass(raw) {
    const s = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!s) return null;

    // Already prefixed?
    if (s.startsWith("bx-") || s.startsWith("bxs-") || s.startsWith("bxl-")) {
        return hasBoxiconGlyph(s) ? `bx ${s}` : null;
    }

    // Bare name: try SOLID first, then normal
    const solid = `bxs-${s}`;
    const normal = `bx-${s}`;
    if (hasBoxiconGlyph(solid)) return `bx ${solid}`;
    if (hasBoxiconGlyph(normal)) return `bx ${normal}`;
    return null;
}
