import {
    initializeBlock,
    useGlobalConfig,
    Box,
    useSettingsButton,
} from '@airtable/blocks/ui';
import React, {useState} from 'react';
import {ErrorBoundary} from "react-error-boundary";
import {base} from "@airtable/blocks";
import {loadCSSFromURLAsync} from '@airtable/blocks/ui';

import Settings from "./settings";
import {GlobalConfigKeys} from "./settings";
import Leaflet from "./leaflet";

import './style.css'
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS for proper rendering
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
loadCSSFromURLAsync("https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css");

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
    const singleIconName = globalConfig.get(GlobalConfigKeys.SINGLE_ICON_NAME);
    const useSingleIcon = globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON);
    const singleColor = globalConfig.get(GlobalConfigKeys.SINGLE_COLOR);
    const singleIconSize = globalConfig.get(GlobalConfigKeys.SINGLE_ICON_SIZE);
    const useSingleColor = globalConfig.get(GlobalConfigKeys.USE_SINGLE_COLOR);
    const useSingleIconSize = globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON_SIZE);

    const table =base.getTableByIdIfExists(tableId);

    // Check if the required global config values are set
    if (!table ||!tableId || !latitudeFieldId || !longitudeFieldId || !nameFieldId ) {
        return <Settings/>
    }

    if(useSingleIcon && !singleIconName || !useSingleIcon && !boxIconFieldId) {
        return <Settings/>
    }

    if(useSingleColor && !singleColor || !useSingleColor && !colorFieldId) {
        return <Settings/>
    }

    if(useSingleIconSize && !singleIconSize || !useSingleIconSize && !iconSizeFieldId) {
        return <Settings/>
    }



    if (isShowingSettings) {
        return <Settings/>
    }

    return (
        <ErrorBoundary
            FallbackComponent={() => <Box padding={3}>Something went wrong!</Box>}
        >
            <Box display="flex" flexDirection="column" height="100vh">
                <Leaflet/>
            </Box>
        </ErrorBoundary>
    );

}

initializeBlock(() => <App/>);