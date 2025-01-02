import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    Box,
    FormField,
    TablePickerSynced,
    FieldPickerSynced,
    useSettingsButton
} from '@airtable/blocks/ui';
import React, {useEffect, useState, useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS for proper rendering
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// Define global configuration keys
const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    LATITUDE_FIELD: 'latitudeFieldId',
    LONGITUDE_FIELD: 'longitudeFieldId',
    NAME_FIELD: 'nameFieldId',
};

function Leaflet() {
    const base = useBase();
    const globalConfig = useGlobalConfig();


    // Retrieve global config values
    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    const latitudeFieldId = globalConfig.get(GlobalConfigKeys.LATITUDE_FIELD);
    const longitudeFieldId = globalConfig.get(GlobalConfigKeys.LONGITUDE_FIELD);
    const nameFieldId = globalConfig.get(GlobalConfigKeys.NAME_FIELD);

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

                if (lat && lon) {
                    const marker = L.marker([lat, lon]).addTo(mapRef.current);
                    marker.bindPopup(`<b>${name || 'No name'}</b>`);
                    markersRef.current.push(marker);
                }
            });
        }
    }, [records, latitudeFieldId, longitudeFieldId, nameFieldId]);

    return (
        <Box display="flex" flexDirection="column" padding={3}>
            <div style={{width: '100%', height: '500px'}}>
                <div id="map" style={{width: '100%', height: '100%'}}></div>
            </div>
        </Box>
    );
}

function Settings() {
    const base = useBase();
    const globalConfig = useGlobalConfig();
    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    const table = tableId ? base.getTableByIdIfExists(tableId) : null;

    return (
        <div>
            <h1>Settings</h1>
            <Box display="flex" flexDirection="column" padding={3} borderBottom="thick">

                <FormField label="Table" width="25%" paddingRight={1}>
                    <TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID}/>
                </FormField>
                {table && (
                    <FormField label="Latitude Field" width="25%" paddingX={1}>
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LATITUDE_FIELD}/>
                    </FormField>
                )}
                {table && (
                    <FormField label="Longitude Field" width="25%" paddingLeft={1}>
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LONGITUDE_FIELD}/>
                    </FormField>
                )}
                {table && (
                    <FormField label="Name Field" width="25%" paddingLeft={1}>
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.NAME_FIELD}/>
                    </FormField>
                )}
            </Box>
        </div>
    );
}

function App() {
    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function () {
        setIsShowingSettings(!isShowingSettings);
    });

    const globalConfig = useGlobalConfig();

    // Retrieve global config values
    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    const latitudeFieldId = globalConfig.get(GlobalConfigKeys.LATITUDE_FIELD);
    const longitudeFieldId = globalConfig.get(GlobalConfigKeys.LONGITUDE_FIELD);
    const nameFieldId = globalConfig.get(GlobalConfigKeys.NAME_FIELD);

    if (!tableId || !latitudeFieldId || !longitudeFieldId || !nameFieldId) {
        return <Settings/>
    }

    if (isShowingSettings) {
        return <Settings/>
    }
    return (
        <Box display="flex" flexDirection="column" height="100vh">
            <Leaflet/>
        </Box>
    );
}

initializeBlock(() => <App/>);
