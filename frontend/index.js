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

import Settings, {getSetupStatus} from "./settings";
import Leaflet from "./leaflet";

import './style.css'
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS for proper rendering
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
loadCSSFromURLAsync("https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css").then();

function App() {
    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function () {
        setIsShowingSettings(!isShowingSettings);
    });

    const globalConfig = useGlobalConfig();

    // Show settings until the required config is complete, or when toggled
    const {isComplete} = getSetupStatus(globalConfig, base);
    if (!isComplete || isShowingSettings) {
        return <Settings onDone={() => setIsShowingSettings(false)}/>;
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