import L from 'leaflet';
import {resolveBoxiconClass} from './iconUtils';

/**
 * Create a custom Leaflet icon using a box icon and a specific color
 * @param {string} icon - The name of the box icon (bare name like "map", or prefixed like "bx-home"/"bxs-map").
 * @param {string} color - The color for the icon.
 * @param {number} iconSize - The size of the icon.
 * @returns {L.DivIcon} - A Leaflet DivIcon instance.
 */
export function createCustomIcon(icon, color, iconSize) {
    // Resolve to an existing Boxicons class; fall back to the default map pin.
    const className = resolveBoxiconClass(icon) || 'bx bxs-map';
    return L.divIcon({
        html: `
            <i
                class="${className}"
                style="width:${iconSize}px; height:${iconSize}px;color:${color};font-size:${iconSize}px"
            ></i>
        `,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
        popupAnchor: [0, -iconSize / 2],
        className: "custom-svg-icon",
    });
}
