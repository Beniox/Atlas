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

    const table = tableId ? base.getTableByIdIfExists(tableId) : null;
    const records = useRecords(table);

    const mapRef = useRef(null);
    const markersRef = useRef([]);

    useEffect(() => {
        // Initialize the map on first render
        const map = L.map('map').setView([51.505, -0.09], 13); // Default center
        mapRef.current = map;

        // Add a tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);


        return () => {
            map.remove();
        };
    }, []);

    useEffect(() => {
        // Clear old markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add new markers if fields are set
        if (records && latitudeFieldId && longitudeFieldId) {
            records.forEach(record => {
                const lat = record.getCellValue(latitudeFieldId);
                const lon = record.getCellValue(longitudeFieldId);
                const name = record.getCellValue(nameFieldId);
                const airtableColor = record.getCellValue(colorFieldId);
                const icon = record.getCellValue(iconFieldId) || "map"
                const iconSize = record.getCellValue(iconSizeFieldId) || 32;

                let color = 'black';
                if(airtableColor) {
                    if(colorUtils.getHexForColor(airtableColor)) {
                        color = colorUtils.getHexForColor(airtableColor);
                    }
                    else if (CSS.supports('color', airtableColor)) {
                        color = airtableColor;
                    }
                }

                if (lat && lon) {
                    // Create a custom Leaflet divIcon
                    const customIcon = createCustomIcon(icon, color, iconSize);

                    const marker = L.marker([lat, lon], {icon: customIcon}).addTo(mapRef.current);
                    marker.bindPopup(`<b>${name || 'No name'}</b>`);
                    markersRef.current.push(marker);
                }
            });
        }

    }, [records, latitudeFieldId, longitudeFieldId, nameFieldId, colorFieldId, iconFieldId, iconSizeFieldId]);

    return (
        <Box display="flex" flexDirection="column" padding={3}>
            <div style={{width: '100%', height: '500px'}}>
                <div id="map" style={{width: '100%', height: '100%'}}></div>
            </div>
        </Box>
    );
}



export default Leaflet;