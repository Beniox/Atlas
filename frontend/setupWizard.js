import {
    Box,
    Button,
    FieldPickerSynced,
    FormField,
    Heading,
    TablePickerSynced,
    Text,
    useBase,
    useGlobalConfig,
} from '@airtable/blocks/ui';
import {FieldType} from '@airtable/blocks/models';
import React from 'react';
import {
    GlobalConfigKeys,
    getSetupStatus,
    defaultConfigPaths,
    autoConfigureFieldsPaths,
    SingleIconNameInput,
} from './settings';
import './style.css';

/**
 * First-run guided setup. Walks new users through the required choices one at
 * a time, with the jargon-free explanations the full settings can't afford.
 *
 * @param {() => void} onFinish - called when the wizard completes
 * @param {() => void} onOpenMarkerSettings - called instead of onFinish when
 *        the user chose per-record marker styling and wants the full settings
 * @param {() => void} onSkip - called when the user skips to the full settings
 */
function SetupWizard({onFinish, onOpenMarkerSettings, onSkip}) {
    const base = useBase();
    const globalConfig = useGlobalConfig();
    const table = base.getTableByIdIfExists(globalConfig.get(GlobalConfigKeys.TABLE_ID));
    const status = getSetupStatus(globalConfig, base);

    const [step, setStep] = React.useState(0);
    const [markerStyle, setMarkerStyle] = React.useState('simple'); // 'simple' | 'custom'

    // Seed the fresh-install defaults (single icon/color/size, warnings on)
    React.useEffect(() => {
        if (!globalConfig.hasPermissionToSet()) return;
        const paths = defaultConfigPaths(globalConfig);
        if (paths.length) globalConfig.setPathsAsync(paths).catch((e) => console.error(e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-suggest latitude/longitude/name as soon as a table is picked
    React.useEffect(() => {
        if (!table || !globalConfig.hasPermissionToSet()) return;
        const paths = autoConfigureFieldsPaths(table, globalConfig);
        if (paths.length) globalConfig.setPathsAsync(paths).catch((e) => console.error(e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table && table.id]);

    const markComplete = async () => {
        try {
            await globalConfig.setAsync(GlobalConfigKeys.SETUP_WIZARD_COMPLETED, true);
        } catch (e) {
            console.error(e);
        }
    };

    const finish = async () => {
        await markComplete();
        if (markerStyle === 'custom') {
            onOpenMarkerSettings();
        } else {
            onFinish();
        }
    };

    const skip = async () => {
        await markComplete();
        onSkip();
    };

    const fieldName = (key) => {
        const field = table && table.getFieldByIdIfExists(globalConfig.get(key));
        return field ? field.name : '—';
    };

    const singleColor = globalConfig.get(GlobalConfigKeys.SINGLE_COLOR) || '#2d7ff9';

    const steps = [
        {
            title: 'Welcome to Atlas',
            canNext: status.hasTable,
            content: (<>
                <Text marginBottom={2}>
                    Atlas turns a table with latitude &amp; longitude values into an
                    interactive map. Let&apos;s set it up together — it takes about a minute.
                </Text>
                <FormField label="Which table contains your locations?">
                    <TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID}/>
                </FormField>
            </>),
        },
        {
            title: 'Where are your locations?',
            canNext: status.hasLocation,
            content: (<>
                <Text marginBottom={2}>
                    Every marker needs a latitude and a longitude — two number fields,
                    e.g. <code>52.5200</code> and <code>13.4050</code>.
                    {status.hasLocation && ' We already found matching fields — just check they’re right.'}
                </Text>
                <FormField label="Latitude field">
                    <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LATITUDE_FIELD}
                                       allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}/>
                </FormField>
                <FormField label="Longitude field">
                    <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LONGITUDE_FIELD}
                                       allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}/>
                </FormField>
            </>),
        },
        {
            title: 'Name your markers',
            canNext: status.hasName,
            content: (<>
                <Text marginBottom={2}>
                    Clicking a marker opens a small popup. Which field should be shown
                    as its title?
                </Text>
                <FormField label="Name field">
                    <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.NAME_FIELD}/>
                </FormField>
            </>),
        },
        {
            title: 'How should your markers look?',
            canNext: markerStyle === 'custom' || status.hasMarkerStyle,
            content: (<>
                <div className="wizard-cards">
                    <button
                        type="button"
                        className={`wizard-card ${markerStyle === 'simple' ? 'wizard-card--selected' : ''}`}
                        onClick={() => setMarkerStyle('simple')}
                    >
                        <i className="bx bxs-map" style={{fontSize: 28, color: singleColor}} aria-hidden="true"/>
                        <strong>Simple</strong>
                        <span>All markers share one icon and color. Recommended to start with.</span>
                    </button>
                    <button
                        type="button"
                        className={`wizard-card ${markerStyle === 'custom' ? 'wizard-card--selected' : ''}`}
                        onClick={() => setMarkerStyle('custom')}
                    >
                        <i className="bx bx-palette" style={{fontSize: 28}} aria-hidden="true"/>
                        <strong>Custom per record</strong>
                        <span>Drive color, icon and size from fields in your table.</span>
                    </button>
                </div>
                {markerStyle === 'simple' ? (
                    <Box marginTop={3}>
                        <FormField label="Marker color">
                            <input
                                type="color"
                                value={singleColor}
                                onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.SINGLE_COLOR, e.target.value)}
                                aria-label="Marker color"
                            />
                        </FormField>
                        <SingleIconNameInput label="Marker icon"/>
                    </Box>
                ) : (
                    <Text marginTop={3}>
                        No problem — we&apos;ll take you to the marker settings after the last
                        step. Until then, markers use the simple style, so your map works
                        right away.
                    </Text>
                )}
            </>),
        },
        {
            title: 'You’re all set!',
            canNext: true,
            content: (<>
                <ul className="wizard-summary">
                    <li><b>Table:</b> {table ? table.name : '—'}</li>
                    <li><b>Latitude / Longitude:</b> {fieldName(GlobalConfigKeys.LATITUDE_FIELD)} / {fieldName(GlobalConfigKeys.LONGITUDE_FIELD)}</li>
                    <li><b>Popup title:</b> {fieldName(GlobalConfigKeys.NAME_FIELD)}</li>
                    <li><b>Marker style:</b> {markerStyle === 'simple' ? 'simple (one icon & color)' : 'custom per record'}</li>
                </ul>
                <Text marginTop={2}>
                    You can fine-tune everything later — clustering, fullscreen, a legend,
                    a fixed start position — via the <i className="bx bx-cog" aria-hidden="true"/> settings
                    button in the top right corner.
                </Text>
            </>),
        },
    ];

    const isLast = step === steps.length - 1;

    return (
        <Box className="setup-wizard">
            <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
                <Heading margin={0} size="small">{steps[step].title}</Heading>
                {!isLast && (
                    <Button variant="secondary" size="small" onClick={skip}>
                        Skip setup
                    </Button>
                )}
            </Box>

            {steps[step].content}

            <Box className="wizard-footer">
                {step > 0 ? (
                    <Button onClick={() => setStep(step - 1)}>Back</Button>
                ) : (
                    <span/>
                )}
                <Text className="wizard-progress">Step {step + 1} of {steps.length}</Text>
                {isLast ? (
                    <Button variant="primary" onClick={finish}>
                        {markerStyle === 'custom' ? 'Open marker settings' : 'Open map'}
                    </Button>
                ) : (
                    <Button variant="primary" disabled={!steps[step].canNext} onClick={() => setStep(step + 1)}>
                        Next
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export default SetupWizard;
