import {
    useBase,
    useRecords,
    useGlobalConfig,
    Box,
    colorUtils,
} from '@airtable/blocks/ui';
import React, {useEffect, useRef} from 'react';
import L from 'leaflet';
import {createCustomIcon} from "./CustomIcon";
import {GlobalConfigKeys} from "./settings";
import 'leaflet-fullscreen';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import {loadCSSFromURLAsync} from '@airtable/blocks/ui';

loadCSSFromURLAsync("https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css").then();

import "leaflet-gesture-handling"

import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";

// import 'leaflet-edgebuffer';


// Safe text
function escapeHTML(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// --- Fast glyph check with memoization -------------------------------------
const _glyphCache = new Map();

// Does a Boxicons class (e.g., "bx-home"/"bxs-map") render a glyph?
function hasBoxiconGlyph(iconClass) {
    if (!iconClass) return false;
    if (_glyphCache.has(iconClass)) return _glyphCache.get(iconClass);

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
    _glyphCache.set(iconClass, ok);
    return ok;
}

// Resolve the best icon class to preview WITHOUT changing the stored value.
// SOLID FIRST for bare names. Returns "bx bxs-..." / "bx bx-..." or null for fallback.
function resolveBoxiconClass(raw) {
    const s = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!s) return null;

    // Already prefixed?
    if (s.startsWith("bx-") || s.startsWith("bxs-") || s.startsWith("bxl-")) {
        return hasBoxiconGlyph(s) ? `bx ${s}` : null;
    }

    // Bare name: try SOLID first, then normal
    const solid  = `bxs-${s}`;
    const normal = `bx-${s}`;
    if (hasBoxiconGlyph(solid))  return `bx ${solid}`;
    if (hasBoxiconGlyph(normal)) return `bx ${normal}`;
    return null;
}

// Build one legend row's HTML (icon + label); uses circle fallback if needed
function legendItemHTML(item) {
    const color = item?.color || "#000000";
    const className = resolveBoxiconClass(item?.icon);

    let iconHTML;
    if (className) {
        iconHTML = `<i class="${className}" style="color:${color};font-size:20px;vertical-align:middle;"></i>`;
    } else if (hasBoxiconGlyph("bxs-circle")) {
        iconHTML = `<i class="bx bxs-circle" style="color:${color};font-size:20px;vertical-align:middle;"></i>`;
    } else {
        iconHTML = `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${color};border:1px solid rgba(0,0,0,.25);vertical-align:middle;"></span>`;
    }

    const label = escapeHTML(item?.text || "");
    return `${iconHTML} ${label}`;
}

let atlasLegendCtrl = null;

/**
 * Renders/removes the legend based on settings.
 * @param {L.Map} map
 * @param {boolean} showLegend
 * @param {"topleft"|"topright"|"bottomleft"|"bottomright"} legendPosition
 * @param {Array<{icon?:string,color?:string,text?:string}>} legendData
 */
function renderAtlasLegend(map, showLegend, legendPosition, legendData) {
    // remove previous (if any)
    if (atlasLegendCtrl) {
        try { map.removeControl(atlasLegendCtrl); } catch {}
        atlasLegendCtrl = null;
    }
    if (!showLegend) return;

    atlasLegendCtrl = L.control({ position: legendPosition });
    atlasLegendCtrl.onAdd = function () {
        const div = L.DomUtil.create("div", "atlas-legend info legend");
        div.setAttribute("aria-label", "Legend");

        const rows = (legendData || []).map(legendItemHTML);
        div.innerHTML = rows.join("<br>");

        // prevent scroll/clicks in the legend from affecting the map
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
    };
    atlasLegendCtrl.addTo(map);
}

// Example usage:
// renderAtlasLegend(map, showLegend, legendPosition, legendData);


function Leaflet() {
    const base = useBase();
    const globalConfig = useGlobalConfig();

    // Retrieve global config values
    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    const latitudeFieldId = globalConfig.get(GlobalConfigKeys.LATITUDE_FIELD);
    const longitudeFieldId = globalConfig.get(GlobalConfigKeys.LONGITUDE_FIELD);
    const nameFieldId = globalConfig.get(GlobalConfigKeys.NAME_FIELD);
    const colorFieldId = globalConfig.get(GlobalConfigKeys.COLOR_FIELD);
    const iconFieldId = globalConfig.get(GlobalConfigKeys.BOX_ICON_FIELD);
    const iconSizeFieldId = globalConfig.get(GlobalConfigKeys.ICON_SIZE_FIELD);
    const useClustering = globalConfig.get(GlobalConfigKeys.USE_CLUSTERING);
    const allowFullScreen = globalConfig.get(GlobalConfigKeys.ALLOW_FULL_SCREEN);
    const singleIconName = globalConfig.get(GlobalConfigKeys.SINGLE_ICON_NAME);
    const useSingleIcon = globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON);
    const singleColor = globalConfig.get(GlobalConfigKeys.SINGLE_COLOR);
    const singleIconSize = globalConfig.get(GlobalConfigKeys.SINGLE_ICON_SIZE);
    const useSingleColor = globalConfig.get(GlobalConfigKeys.USE_SINGLE_COLOR);
    const useSingleIconSize = globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON_SIZE);
    const useGestureHandling = globalConfig.get(GlobalConfigKeys.GESTUREHANDLING) || false;
    const useFixesStartLocation = globalConfig.get(GlobalConfigKeys.USE_FIXED_START_LOCATION);
    const startLatitude = globalConfig.get(GlobalConfigKeys.START_LATITUDE);
    const startLongitude = globalConfig.get(GlobalConfigKeys.START_LONGITUDE);
    const startZoom = globalConfig.get(GlobalConfigKeys.START_ZOOM);


    const table = base.getTableByIdIfExists(tableId); // should never happen that table is null

    const opts = {
        tableId,
        latitudeFieldId,
        longitudeFieldId,
        nameFieldId,
    }
    if (!useSingleColor) {
        opts.colorFieldId = colorFieldId;
    }
    if (!useSingleIcon) {
        opts.iconFieldId = iconFieldId;
    }
    if (!useSingleIconSize) {
        opts.iconSizeFieldId = iconSizeFieldId;
    }

    const firstRun = useRef(true);


    const records = useRecords(table, opts);

    const mapRef = useRef(null);
    const clusterGroupRef = useRef(null);

    const legendJSON = globalConfig.get(GlobalConfigKeys.LEGEND) || '[]';
    let legendData = "";
    try {
        legendData = JSON.parse(legendJSON);
    } catch (e) {
        console.error(e);
    }
    const legendPosition = globalConfig.get(GlobalConfigKeys.LEGEND_POSITION) || 'bottomleft';
    const showLegend = globalConfig.get(GlobalConfigKeys.SHOW_LEGEND) || false;


    useEffect(() => {
        // Initialize the map on first render
        const map = L.map('map', {
            fullscreenControl: allowFullScreen,
            gestureHandling: useGestureHandling
        }).setView([51.505, -0.09], 13); // Default center

        // Add a tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Initialize a MarkerClusterGroup
        const markerClusterGroup = L.markerClusterGroup();
        clusterGroupRef.current = markerClusterGroup;

        // Add the cluster group to the map
        map.addLayer(markerClusterGroup);


        if (showLegend) {
            try {
                renderAtlasLegend(map, true, legendPosition, legendData);
            } catch (e) {
                console.error(e);
            }
        } else {
            renderAtlasLegend(map, false); // ensures any old legend is removed
        }

        // Prevents users from getting trapped on the map when scrolling a long page.
        if (useGestureHandling) {
            map.on('fullscreenchange', function () {
                if (map.isFullscreen()) {
                    map.gestureHandling.disable();
                } else {
                    map.gestureHandling.enable();
                }
            });
        }


        mapRef.current = map;
        return () => {
            map.remove();
        };
    }, []);

    useEffect(() => {


        // Clear old markers
        // markersRef.current.forEach(marker => marker.remove());
        // markersRef.current = [];

        if (!clusterGroupRef.current) return;
        // Clear old clusters
        clusterGroupRef.current.clearLayers();


        // Add new markers if fields are set
        if (records && latitudeFieldId && longitudeFieldId) {
            records.forEach(record => {
                try {
                    const lat = record.getCellValue(latitudeFieldId);
                    const lon = record.getCellValue(longitudeFieldId);

                    const name = record.getCellValue(nameFieldId);

                    // Determine icon
                    const iconName = useSingleIcon ? singleIconName : record.getCellValue(iconFieldId) || 'map';

                    // Determine icon size
                    let iconSize = useSingleIconSize ? singleIconSize : record.getCellValue(iconSizeFieldId);
                    if (iconSize == null) iconSize = 32;

                    // Determine color
                    let color = 'black';
                    if (useSingleColor) {
                        if (CSS.supports('color', singleColor)) {
                            color = singleColor;
                        }
                    } else {
                        const airtableColor = record.getCellValue(colorFieldId);
                        if (airtableColor) {
                            if (colorUtils.getHexForColor(airtableColor.color)) {
                                color = colorUtils.getHexForColor(airtableColor.color);
                            } else if (CSS.supports('color', airtableColor)) {
                                color = airtableColor;
                            }
                        }
                    }


                    if (isValidLocation(lat, lon) && iconSize > 0) {
                        // Create a custom Leaflet divIcon
                        const customIcon = createCustomIcon(iconName, color, iconSize);

                        const marker = L.marker([lat, lon], {icon: customIcon});
                        marker.bindPopup(`<b>${name || 'No name'}</b>`);
                        // clusterGroupRef.current.push(marker);
                        if (useClustering) {
                            clusterGroupRef.current.addLayer(marker);
                        } else {
                            mapRef.current.addLayer(marker);
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            });
        }


        if (firstRun.current) {
            goToHome();
            firstRun.current = false;
        }


    }, [records,
        latitudeFieldId,
        longitudeFieldId,
        nameFieldId,
        colorFieldId,
        iconFieldId,
        iconSizeFieldId,
        useSingleColor,
        singleColor,
        useSingleIcon,
        singleIconName,
        useSingleIconSize,
        singleIconSize,
        useClustering,
    ]);

    function goToHome() {

        if (useFixesStartLocation) {
            mapRef.current.setView([startLatitude || 0, startLongitude || 0], startZoom || 8);
        } else {


            // 3) Now that *all* markers are on the map, grab the bounds…
            const bounds = mapRef.current.getBounds();
            if (bounds.isValid()) {
                // 4a) Fit to show all markers (with 10% padding)
                mapRef.current.fitBounds(bounds.pad(0.1), {animate: false});

                // 4b) Then recenter on *your* “primary” marker
                //    (replace this with whatever record you want centered)
                const primary = records[0];
                const primaryLatLng = [
                    primary.getCellValue(latitudeFieldId),
                    primary.getCellValue(longitudeFieldId),
                ];
                mapRef.current.setView(primaryLatLng, mapRef.current.getZoom());
            }
        }
    }

    return (
        <Box display="flex" flexDirection="column">
            <div style={{width: '100%', height: '100vh'}}>
                <div id="map" style={{width: '100%', height: '100%'}}></div>
            </div>
        </Box>
    );
}


/**
 * Check if the location is valid
 * @param lat - The latitude
 * @param lon - The longitude
 * @returns {boolean}
 */
function isValidLocation(lat, lon) {
    const valid = (
        typeof lat === 'number' &&
        typeof lon === 'number' &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
    );
    if (!valid) {
        console.log(`Invalid location: ${lat}, ${lon}`);
    }
    return valid;
}


export default Leaflet;