import {
    useBase,
    useRecords,
    useGlobalConfig,
    Box,
    colorUtils,
} from '@airtable/blocks/ui';
import React, {useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import {createCustomIcon} from "./CustomIcon";
import {GlobalConfigKeys} from "./settings";
import 'leaflet-fullscreen';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import {loadCSSFromURLAsync} from '@airtable/blocks/ui';

// The bundler doesn't resolve the image files referenced by the package's
// CSS, so the fullscreen control style has to come from the CDN.
loadCSSFromURLAsync("https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css").then();

import "leaflet-gesture-handling"

import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";

// import 'leaflet-edgebuffer';

import {boxiconsCssLoaded, escapeHTML, hasBoxiconGlyph, resolveBoxiconClass} from './iconUtils';

// Build one legend row's HTML (icon + label); uses circle fallback if needed
function legendItemHTML(item) {
    // The color lands in a style attribute via innerHTML — only accept
    // values the browser recognizes as a color, never arbitrary strings.
    const rawColor = (item?.color || "").trim();
    const color = rawColor && CSS.supports('color', rawColor) ? rawColor : "#000000";
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

/**
 * Renders/removes the legend based on settings.
 * @param {L.Map} map
 * @param {{current: L.Control|null}} legendCtrlRef - ref holding the current legend control
 * @param {boolean} showLegend
 * @param {"topleft"|"topright"|"bottomleft"|"bottomright"} legendPosition
 * @param {Array<{icon?:string,color?:string,text?:string}>} legendData
 */
function renderAtlasLegend(map, legendCtrlRef, showLegend, legendPosition, legendData) {
    // remove previous (if any)
    if (legendCtrlRef.current) {
        try { map.removeControl(legendCtrlRef.current); } catch { /* already removed */ }
        legendCtrlRef.current = null;
    }
    // Nothing to show for an enabled-but-empty legend
    if (!showLegend || !(legendData || []).length) return;

    const ctrl = L.control({ position: legendPosition });
    ctrl.onAdd = function () {
        const div = L.DomUtil.create("div", "atlas-legend info legend");
        div.setAttribute("aria-label", "Legend");

        const rows = (legendData || []).map(legendItemHTML);
        div.innerHTML = rows.join("<br>");

        // prevent scroll/clicks in the legend from affecting the map
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
    };
    ctrl.addTo(map);
    legendCtrlRef.current = ctrl;
}

/**
 * Shows a warning control listing marker problems: records that could not be
 * placed on the map and records rendered with a fallback icon.
 * @param {L.Map} map
 * @param {{current: L.Control|null}} ctrlRef - ref holding the current warning control
 * @param {Array<{name:string,reason:string}>} invalidRecords
 */
function renderInvalidWarning(map, ctrlRef, invalidRecords) {
    if (ctrlRef.current) {
        try { map.removeControl(ctrlRef.current); } catch { /* already removed */ }
        ctrlRef.current = null;
    }
    if (!invalidRecords.length) return;

    const ctrl = L.control({position: 'topright'});
    ctrl.onAdd = function () {
        const div = L.DomUtil.create('div', 'atlas-warning');
        div.setAttribute('aria-label', 'Map issues');

        const maxShown = 10;
        const items = invalidRecords.slice(0, maxShown)
            .map(({name, reason}) => `<li><b>${escapeHTML(name) || 'Unnamed'}</b> — ${escapeHTML(reason)}</li>`)
            .join('');
        const more = invalidRecords.length > maxShown
            ? `<li>…and ${invalidRecords.length - maxShown} more</li>`
            : '';
        const plural = invalidRecords.length === 1 ? 'issue' : 'issues';
        div.innerHTML = `
            <details>
                <summary><i class="bx bxs-error" aria-hidden="true"></i>${invalidRecords.length} map ${plural}</summary>
                <ul>${items}${more}</ul>
            </details>`;

        // prevent scroll/clicks in the warning from affecting the map
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
    };
    ctrl.addTo(map);
    ctrlRef.current = ctrl;
}

/**
 * Centered "no markers" message so an empty map doesn't look broken.
 * @param {L.Map} map
 * @param {{current: L.Control|null}} ctrlRef
 * @param {string} message - text to show, or '' to hide
 */
function renderEmptyState(map, ctrlRef, message) {
    if (ctrlRef.current) {
        try { map.removeControl(ctrlRef.current); } catch { /* already removed */ }
        ctrlRef.current = null;
    }
    if (!message) return;

    const ctrl = L.control({position: 'bottomleft'});
    ctrl.onAdd = function () {
        const div = L.DomUtil.create('div', 'atlas-empty');
        div.setAttribute('role', 'status');
        div.innerHTML = `<i class="bx bx-map-alt" aria-hidden="true"></i> ${escapeHTML(message)}`;
        L.DomEvent.disableClickPropagation(div);
        return div;
    };
    ctrl.addTo(map);
    ctrlRef.current = ctrl;
}


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
    const showInvalidWarning = globalConfig.get(GlobalConfigKeys.SHOW_INVALID_WARNING) ?? true; // on unless disabled
    const useFixesStartLocation = globalConfig.get(GlobalConfigKeys.USE_FIXED_START_LOCATION);
    const startLatitude = globalConfig.get(GlobalConfigKeys.START_LATITUDE);
    const startLongitude = globalConfig.get(GlobalConfigKeys.START_LONGITUDE);
    const startZoom = globalConfig.get(GlobalConfigKeys.START_ZOOM);


    const table = base.getTableByIdIfExists(tableId); // should never happen that table is null

    // Only watch the fields the map actually uses, so unrelated cell edits
    // don't rebuild the markers. Skip ids of fields that no longer exist —
    // useRecords would throw on them.
    const watchedFieldIds = [latitudeFieldId, longitudeFieldId, nameFieldId];
    if (!useSingleColor) {
        watchedFieldIds.push(colorFieldId);
    }
    if (!useSingleIcon) {
        watchedFieldIds.push(iconFieldId);
    }
    if (!useSingleIconSize) {
        watchedFieldIds.push(iconSizeFieldId);
    }
    const opts = {
        fields: table
            ? watchedFieldIds.filter((fieldId) => fieldId && table.getFieldByIdIfExists(fieldId))
            : [],
    };

    const firstRun = useRef(true);

    // The icon stylesheet loads asynchronously; markers and legend rendered
    // before it arrives fall back to the default pin/circle, so re-render
    // them once it's ready.
    const [iconsReady, setIconsReady] = useState(false);
    useEffect(() => {
        let cancelled = false;
        boxiconsCssLoaded.then(() => {
            if (!cancelled) setIconsReady(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const records = useRecords(table, opts);

    const mapRef = useRef(null);
    const clusterGroupRef = useRef(null);
    const markerGroupRef = useRef(null); // non-clustered markers
    const legendCtrlRef = useRef(null);
    const fullscreenCtrlRef = useRef(null);
    const invalidWarningCtrlRef = useRef(null);
    const emptyStateCtrlRef = useRef(null);

    const legendJSON = globalConfig.get(GlobalConfigKeys.LEGEND) || '[]';
    const legendPosition = globalConfig.get(GlobalConfigKeys.LEGEND_POSITION) || 'bottomleft';
    const showLegend = globalConfig.get(GlobalConfigKeys.SHOW_LEGEND) || false;


    useEffect(() => {
        // Initialize the map on first render
        const map = L.map('map', {
            gestureHandling: false, // toggled by its own effect below
        }).setView([51.505, -0.09], 13); // Default center

        // Add a tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // One group for clustered markers, one for plain markers
        clusterGroupRef.current = L.markerClusterGroup();
        markerGroupRef.current = L.featureGroup();
        map.addLayer(clusterGroupRef.current);
        map.addLayer(markerGroupRef.current);

        mapRef.current = map;
        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Fullscreen control (added/removed live when the setting changes)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !allowFullScreen) return;
        const ctrl = L.control.fullscreen();
        map.addControl(ctrl);
        fullscreenCtrlRef.current = ctrl;
        return () => {
            map.removeControl(ctrl);
            fullscreenCtrlRef.current = null;
        };
    }, [allowFullScreen]);

    // Gesture handling (toggled live when the setting changes)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.gestureHandling) return;

        if (useGestureHandling) {
            map.gestureHandling.enable();
        } else {
            map.gestureHandling.disable();
        }

        // Prevents users from getting trapped on the map when scrolling a long page,
        // while still allowing normal scroll-zoom in fullscreen.
        const onFullscreenChange = () => {
            if (!useGestureHandling) return;
            if (map.isFullscreen()) {
                map.gestureHandling.disable();
            } else {
                map.gestureHandling.enable();
            }
        };
        map.on('fullscreenchange', onFullscreenChange);
        return () => {
            map.off('fullscreenchange', onFullscreenChange);
        };
    }, [useGestureHandling]);

    // Legend (re-rendered live when its settings change)
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        let legendData = [];
        try {
            legendData = JSON.parse(legendJSON);
        } catch (e) {
            console.error(e);
        }
        try {
            renderAtlasLegend(map, legendCtrlRef, showLegend, legendPosition, legendData);
        } catch (e) {
            console.error(e);
        }
    }, [showLegend, legendPosition, legendJSON, iconsReady]);

    useEffect(() => {

        if (!clusterGroupRef.current || !markerGroupRef.current) return;
        // Clear old markers from both groups
        clusterGroupRef.current.clearLayers();
        markerGroupRef.current.clearLayers();


        // Marker problems shown in the warning control: records that can't be
        // placed, or that render with the fallback icon
        const invalidRecords = [];

        // An invalid single icon affects every marker — warn once
        if (useSingleIcon && !resolveBoxiconClass(singleIconName)) {
            invalidRecords.push({
                name: 'All markers',
                reason: `unknown icon "${singleIconName}" (default pin shown)`,
            });
        }

        // A single size of 0 hides every marker — almost always a mistake, warn once
        if (useSingleIconSize && Number(singleIconSize) === 0) {
            invalidRecords.push({
                name: 'All markers',
                reason: 'marker size is 0, so nothing is shown',
            });
        }

        let placedCount = 0;

        // Add new markers if fields are set
        if (records && latitudeFieldId && longitudeFieldId) {
            records.forEach(record => {
                try {
                    const lat = record.getCellValue(latitudeFieldId);
                    const lon = record.getCellValue(longitudeFieldId);

                    const name = record.getCellValueAsString(nameFieldId);

                    // Determine icon
                    const iconName = useSingleIcon ? singleIconName : record.getCellValue(iconFieldId) || 'map';

                    // Determine icon size (0 hides the marker; empty/invalid defaults to 32)
                    let iconSize = useSingleIconSize ? singleIconSize : record.getCellValue(iconSizeFieldId);
                    if (iconSize == null || iconSize === '') {
                        iconSize = 32;
                    } else {
                        iconSize = Number(iconSize);
                        if (!Number.isFinite(iconSize)) iconSize = 32;
                    }

                    // Determine color
                    let color = 'black';
                    let colorInvalid = false;
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
                            } else {
                                colorInvalid = true; // has a value, but not a usable color
                            }
                        }
                    }


                    if (iconSize > 0) { // size 0 hides the marker on purpose
                        if (isValidLocation(lat, lon)) {
                            if (!useSingleIcon && !resolveBoxiconClass(iconName)) {
                                invalidRecords.push({
                                    name,
                                    reason: `unknown icon "${iconName}" (default pin shown)`,
                                });
                            }
                            if (colorInvalid) {
                                invalidRecords.push({
                                    name,
                                    reason: 'unknown color (black shown)',
                                });
                            }

                            // Create a custom Leaflet divIcon
                            const customIcon = createCustomIcon(iconName, color, iconSize);

                            const marker = L.marker([lat, lon], {icon: customIcon});
                            marker.bindPopup(`<b>${escapeHTML(name) || 'No name'}</b>`);
                            if (useClustering) {
                                clusterGroupRef.current.addLayer(marker);
                            } else {
                                markerGroupRef.current.addLayer(marker);
                            }
                            placedCount++;
                        } else {
                            invalidRecords.push({
                                name,
                                reason: lat == null && lon == null
                                    ? 'missing coordinates'
                                    : `invalid coordinates (${lat}, ${lon})`,
                            });
                        }
                    }
                } catch (e) {
                    console.error(e);
                    invalidRecords.push({
                        name: record.name,
                        reason: 'could not be read (was a configured field deleted?)',
                    });
                }
            });
        }


        if (mapRef.current) {
            renderInvalidWarning(mapRef.current, invalidWarningCtrlRef, showInvalidWarning ? invalidRecords : []);

            // Distinguish "no data" from "misconfigured" so an empty map isn't mistaken for broken
            let emptyMessage = '';
            if (placedCount === 0) {
                emptyMessage = !records || records.length === 0
                    ? 'No records to show. Add rows to your table, or check your view’s filters.'
                    : 'No records could be placed on the map — see the warning for details.';
            }
            renderEmptyState(mapRef.current, emptyStateCtrlRef, emptyMessage);
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
        showInvalidWarning,
        iconsReady,
    ]);

    function goToHome() {
        if (useFixesStartLocation) {
            mapRef.current.setView(
                [Number(startLatitude) || 0, Number(startLongitude) || 0],
                Number(startZoom) || 8
            );
        } else {
            // Fit the view to the markers (not the current viewport)
            const group = useClustering ? clusterGroupRef.current : markerGroupRef.current;
            const bounds = group.getBounds();
            if (bounds.isValid()) {
                mapRef.current.fitBounds(bounds.pad(0.1), {animate: false});
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
    return (
        typeof lat === 'number' &&
        typeof lon === 'number' &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
    );
}


export default Leaflet;