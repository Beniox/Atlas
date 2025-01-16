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
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

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

    const table = tableId ? base.getTableByIdIfExists(tableId) : null;

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


    const records = useRecords(table, opts);

    const mapRef = useRef(null);
    const clusterGroupRef = useRef(null);

    useEffect(() => {
        // Initialize the map on first render
        const map = L.map('map', {fullscreenControl: allowFullScreen}).setView([51.505, -0.09], 13); // Default center

        // Add a tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Initialize a MarkerClusterGroup
        const markerClusterGroup = L.markerClusterGroup();
        clusterGroupRef.current = markerClusterGroup;
        console.log(markerClusterGroup);

        // Add the cluster group to the map
        map.addLayer(markerClusterGroup);


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
                const lat = record.getCellValue(latitudeFieldId);
                const lon = record.getCellValue(longitudeFieldId);

                const name = record.getCellValue(nameFieldId);

                // Determine icon
                const iconName = useSingleIcon ? singleIconName : record.getCellValue(iconFieldId) || 'map';

                // Determine icon size
                let iconSize = useSingleIconSize ? singleIconSize : record.getCellValue(iconSizeFieldId);
                if (iconSize == null) iconSize = 32;

                // Determine color
                let color = useSingleColor ? singleColor : 'black';
                const airtableColor = record.getCellValue(colorFieldId);
                if (!useSingleColor && airtableColor) {
                    if (colorUtils.getHexForColor(airtableColor)) {
                        color = colorUtils.getHexForColor(airtableColor);
                    } else if (CSS.supports('color', airtableColor)) {
                        color = airtableColor;
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
            });
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
        useClustering,]);

    return (
        <Box display="flex" flexDirection="column" padding={3}>
            <div style={{width: '100%', height: '500px'}}>
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