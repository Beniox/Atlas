import {
    initializeBlock,
    useGlobalConfig,
    Box,
    useSettingsButton,
} from '@airtable/blocks/ui';
import React, {useEffect, useState} from 'react';
import {ErrorBoundary} from "react-error-boundary";
import {base} from "@airtable/blocks";

import Settings, {getSetupStatus, GlobalConfigKeys} from "./settings";
import SetupWizard from "./setupWizard";
import Leaflet from "./leaflet";

import './style.css'
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS for proper rendering
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
// The boxicons stylesheet (CDN) is loaded by iconUtils.js

function App() {
    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function () {
        setIsShowingSettings(!isShowingSettings);
    });

    const globalConfig = useGlobalConfig();

    const {isComplete} = getSetupStatus(globalConfig, base);
    const wizardCompleted = globalConfig.get(GlobalConfigKeys.SETUP_WIZARD_COMPLETED);
    const wizardEligible = !wizardCompleted && globalConfig.hasPermissionToSet();

    // Once the wizard starts, keep it up for all its steps — auto-suggested
    // fields can make the config "complete" right after the table is picked,
    // and that must not skip the remaining steps.
    const [wizardStarted, setWizardStarted] = useState(false);
    useEffect(() => {
        if (wizardEligible && !isComplete) {
            setWizardStarted(true);
        }
    }, [wizardEligible, isComplete]);

    // First run: guided setup for editors (the settings button still opens the full settings)
    if (wizardEligible && !isShowingSettings && (wizardStarted || !isComplete)) {
        return (
            <SetupWizard
                onFinish={() => setIsShowingSettings(false)}
                onSkip={() => setIsShowingSettings(true)}
            />
        );
    }

    // Show settings until the required config is complete, or when toggled
    if (!isComplete || isShowingSettings) {
        return (
            <Settings
                onDone={() => setIsShowingSettings(false)}
                onReset={() => setIsShowingSettings(false)}
            />
        );
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