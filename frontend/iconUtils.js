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
