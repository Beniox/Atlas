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
                // add legend
                const legend = L.control({position: legendPosition});
                legend.onAdd = function () {
                    const div = L.DomUtil.create('div', 'info legend');
                    let content = "";
                    legendData.map((item) => {
                        content += `<i class="bx bxs-${item.icon}" style="color: ${item.color}; font-size: 20px;"></i> ${item.text}<br>`;
                    });
                    div.innerHTML = content;
                    return div;
                }
                legend.addTo(map);
            } catch (e) {
                console.error(e);
            }
        }

        // Prevents users from getting trapped on the map when scrolling a long page.
        if (useGestureHandling) {
            map.on('fullscreenchange', function () {
                if (map.isFullscreen()) {
                    console.log('entered fullscreen');
                    map.gestureHandling.disable();
                } else {
                    console.log('exited fullscreen');
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