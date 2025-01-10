import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    Box,
    FormField,
    TablePickerSynced,
    FieldPickerSynced,
    useSettingsButton,
    colorUtils,
} from '@airtable/blocks/ui';
import React, {useEffect, useState, useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS for proper rendering
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'boxicons'
import {FieldType} from "@airtable/blocks/models";
// import SVGMarker from "./SVGMarker";

// Define global configuration keys
const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    LATITUDE_FIELD: 'latitudeFieldId',
    LONGITUDE_FIELD: 'longitudeFieldId',
    NAME_FIELD: 'nameFieldId',
    COLOR_FIELD: 'colorFieldId',
    BOX_ICON_FIELD: 'boxIconFieldId',
    ICON_SIZE_FIELD: 'iconSizeFieldId',
};

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

                const color = airtableColor ? colorUtils.getHexForColor(airtableColor.color) : '#000000';

                if (lat && lon) {
                    // Create a custom Leaflet divIcon
                    const customIcon = L.divIcon({
                        html: `<box-icon type='solid' name='${icon}' color='${color}' style="width:${iconSize}px; height:${iconSize}px;"></box-icon>`,
                        iconSize: [iconSize, iconSize], // Adjust size as needed
                        iconAnchor: [iconSize / 2, iconSize / 2], // Adjust anchor point
                        popupAnchor: [0, -iconSize / 2], // Position popup above the icon
                        className: 'custom-svg-icon', // Optional custom class for styling
                    });

                    const marker = L.marker([lat, lon], {icon: customIcon}).addTo(mapRef.current);
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
            <Box padding={3} borderBottom="thick">
                <h1>Settings</h1>
                <FormField label="Table" paddingRight={1}>
                    <TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID}/>
                </FormField>
                {table && (
                    <FormField label="Latitude Field" paddingX={1}>
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LATITUDE_FIELD}/>
                    </FormField>
                )}
                {table && (
                    <FormField label="Longitude Field" paddingLeft={1}>
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LONGITUDE_FIELD}/>
                    </FormField>
                )}
                {table && (
                    <FormField label="Name Field" paddingLeft={1}>
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.NAME_FIELD}/>
                    </FormField>
                )}
                {table && (
                    <FormField label="Color Field" paddingLeft={1}>
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.COLOR_FIELD}
                                           allowedTypes={[FieldType.SINGLE_SELECT, FieldType.SINGLE_LINE_TEXT, FieldType.FORMULA]}/>
                    </FormField>
                )}


                {table && (
                    <FormField label="Box Icon Field" paddingLeft={1}>
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.BOX_ICON_FIELD}
                                           allowedTypes={[FieldType.SINGLE_LINE_TEXT, FieldType.FORMULA]}/>
                    </FormField>
                )}
                <p>Go to <a href="https://boxicons.com/">https://boxicons.com/</a> and select an icon name</p>

                {table && (
                    <FormField label="Icon Size Field" paddingLeft={1}>
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.ICON_SIZE_FIELD}
                                           allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}/>
                    </FormField>
                )}

                <div>
                    <h2>About</h2>
                    <p>Made by Benjamin Stieler</p>

                    <p>Uses https://boxicons.com/ for icons </p>

                </div>
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
    const colorFieldId = globalConfig.get(GlobalConfigKeys.COLOR_FIELD);
    const boxIconFieldId = globalConfig.get(GlobalConfigKeys.BOX_ICON_FIELD);
    const iconSizeFieldId = globalConfig.get(GlobalConfigKeys.ICON_SIZE_FIELD);

    if (!tableId || !latitudeFieldId || !longitudeFieldId || !nameFieldId || !colorFieldId || !boxIconFieldId || !iconSizeFieldId) {
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
