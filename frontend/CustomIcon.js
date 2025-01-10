import L from 'leaflet';
import 'boxicons/css/boxicons.min.css';
/**
 * Create a custom Leaflet icon using a box icon and a specific color
 * @param {string} icon - The name of the box icon.
 * @param {string} color - The color for the icon.
 * @param {number} iconSize - The size of the icon.
 * @returns {L.DivIcon} - A Leaflet DivIcon instance.
 */
export function createCustomIcon(icon, color, iconSize) {
    return L.divIcon({
        html: `
            <i
                class="bx bxs-${icon}"
                style="width:${iconSize}px; height:${iconSize}px;color:${color};font-size:${iconSize}px"
            ></box-icon>
        `,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
        popupAnchor: [0, -iconSize / 2],
        className: "custom-svg-icon",
    });
}