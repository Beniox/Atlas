import {
    initializeBlock,
    useGlobalConfig,
    Box,
    useSettingsButton,
} from '@airtable/blocks/ui';
import React, {useEffect, useState} from 'react';
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS for proper rendering
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import {ErrorBoundary} from "react-error-boundary";
import Settings from "./settings";
import {GlobalConfigKeys} from "./settings";
import './style.css'
import Leaflet from "./leaflet";

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

    useEffect(() => {
        // Dynamically add Boxicons CDN to the head tag
        const link = document.createElement("link");
        link.href = "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css";
        link.rel = "stylesheet";
        document.head.appendChild(link);

        // Cleanup when the component is unmounted
        return () => {
            document.head.removeChild(link);
        };
    }, []);


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