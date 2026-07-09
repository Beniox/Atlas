import {
    Box,
    Button,
    FieldPickerSynced,
    FormField,
    Heading,
    Input,
    SelectButtons,
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

const SOURCE_OPTIONS = [
    {value: 'single', label: 'Same for all markers'},
    {value: 'field', label: 'From a field'},
];

/**
 * First-run guided setup. Walks new users through the required choices one at
 * a time, with the jargon-free explanations the full settings can't afford.
 * Choosing "custom" marker styling adds one step each for icon, color and
 * size, so the whole configuration happens inside the wizard.
 *
 * @param {() => void} onFinish - called when the wizard completes
 * @param {() => void} onSkip - called when the user skips to the full settings
 */
function SetupWizard({onFinish, onSkip}) {
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
        onFinish();
    };

    const skip = async () => {
        await markComplete();
        onSkip();
    };

    const fieldName = (key) => {
        const field = table && table.getFieldByIdIfExists(globalConfig.get(key));
        return field ? field.name : '—';
    };

    const useSingleColor = globalConfig.get(GlobalConfigKeys.USE_SINGLE_COLOR);
    const useSingleIcon = globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON);
    const useSingleIconSize = globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON_SIZE);
    const singleColor = globalConfig.get(GlobalConfigKeys.SINGLE_COLOR) || '#2d7ff9';
    const singleIconName = globalConfig.get(GlobalConfigKeys.SINGLE_ICON_NAME);
    const singleIconSize = globalConfig.get(GlobalConfigKeys.SINGLE_ICON_SIZE);

    const selectSimple = () => {
        setMarkerStyle('simple');
        globalConfig.setPathsAsync([
            {path: [GlobalConfigKeys.USE_SINGLE_COLOR], value: true},
            {path: [GlobalConfigKeys.USE_SINGLE_ICON], value: true},
            {path: [GlobalConfigKeys.USE_SINGLE_ICON_SIZE], value: true},
        ]).catch((e) => console.error(e));
    };

    const selectCustom = () => {
        setMarkerStyle('custom');
        globalConfig.setPathsAsync([
            {path: [GlobalConfigKeys.USE_SINGLE_COLOR], value: false},
            {path: [GlobalConfigKeys.USE_SINGLE_ICON], value: false},
            {path: [GlobalConfigKeys.USE_SINGLE_ICON_SIZE], value: false},
        ]).catch((e) => console.error(e));
    };

    // "Same for all markers" / "From a field" toggle used by the aspect steps
    const sourceButtons = (useSingleKey, useSingleValue) => (
        <SelectButtons
            value={useSingleValue ? 'single' : 'field'}
            onChange={(v) => globalConfig.setAsync(useSingleKey, v === 'single')}
            options={SOURCE_OPTIONS}
            size="small"
        />
    );

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
                        onClick={selectSimple}
                    >
                        <i className="bx bxs-map" style={{fontSize: 28, color: singleColor}} aria-hidden="true"/>
                        <strong>Simple</strong>
                        <span>All markers share one icon and color. Recommended to start with.</span>
                    </button>
                    <button
                        type="button"
                        className={`wizard-card ${markerStyle === 'custom' ? 'wizard-card--selected' : ''}`}
                        onClick={selectCustom}
                    >
                        <i className="bx bx-palette" style={{fontSize: 28}} aria-hidden="true"/>
                        <strong>Custom per record</strong>
                        <span>Icon, color and size come from fields in your table.</span>
                    </button>
                </div>
                {markerStyle === 'simple' ? (
                    <Box marginTop={3}>
                        <SingleIconNameInput label="Marker icon"/>
                        <FormField label="Marker color">
                            <input
                                type="color"
                                value={singleColor}
                                onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.SINGLE_COLOR, e.target.value)}
                                aria-label="Marker color"
                            />
                        </FormField>
                    </Box>
                ) : (
                    <Text marginTop={3}>
                        The next steps let you pick, for each of icon, color and size,
                        either a field from your table or one shared value.
                    </Text>
                )}
            </>),
        },
    ];

    if (markerStyle === 'custom') {
        steps.push(
            {
                title: 'Marker icon',
                canNext: status.iconOk,
                content: (<>
                    <Text marginBottom={2}>Where should the marker icon come from?</Text>
                    {sourceButtons(GlobalConfigKeys.USE_SINGLE_ICON, useSingleIcon)}
                    <Box marginTop={2}>
                        {useSingleIcon ? (
                            <SingleIconNameInput label="Icon"/>
                        ) : (
                            <FormField label="Icon field">
                                <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.BOX_ICON_FIELD}
                                                   allowedTypes={[FieldType.SINGLE_LINE_TEXT, FieldType.FORMULA]}/>
                                <Text textColor="light" marginTop={1}>
                                    A text field with a Boxicons name per record, e.g. map, bx-home
                                    or bxs-star. Records with an empty or unknown name get the
                                    default pin.
                                </Text>
                            </FormField>
                        )}
                    </Box>
                </>),
            },
            {
                title: 'Marker color',
                canNext: status.colorOk,
                content: (<>
                    <Text marginBottom={2}>Where should the marker color come from?</Text>
                    {sourceButtons(GlobalConfigKeys.USE_SINGLE_COLOR, useSingleColor)}
                    <Box marginTop={2}>
                        {useSingleColor ? (
                            <FormField label="Color">
                                <input
                                    type="color"
                                    value={singleColor}
                                    onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.SINGLE_COLOR, e.target.value)}
                                    aria-label="Marker color"
                                />
                            </FormField>
                        ) : (
                            <FormField label="Color field">
                                <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.COLOR_FIELD}
                                                   allowedTypes={[FieldType.SINGLE_SELECT, FieldType.SINGLE_LINE_TEXT, FieldType.FORMULA]}/>
                                <Text textColor="light" marginTop={1}>
                                    Single select fields use the option&apos;s color. Text and formula
                                    fields accept any CSS color, e.g. red, #00ff00 or rgba(0,0,0,0.5).
                                </Text>
                            </FormField>
                        )}
                    </Box>
                </>),
            },
            {
                title: 'Marker size',
                canNext: status.sizeOk,
                content: (<>
                    <Text marginBottom={2}>Where should the marker size come from?</Text>
                    {sourceButtons(GlobalConfigKeys.USE_SINGLE_ICON_SIZE, useSingleIconSize)}
                    <Box marginTop={2}>
                        {useSingleIconSize ? (
                            <FormField label="Size (pixels)">
                                <Input
                                    type="number"
                                    value={singleIconSize ?? ''}
                                    onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.SINGLE_ICON_SIZE,
                                        e.target.value === '' ? undefined : Number(e.target.value))}
                                    placeholder="e.g. 32"
                                />
                            </FormField>
                        ) : (
                            <FormField label="Size field">
                                <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.ICON_SIZE_FIELD}
                                                   allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}/>
                                <Text textColor="light" marginTop={1}>
                                    A number field with the size in pixels. 0 hides the marker;
                                    empty uses 32.
                                </Text>
                            </FormField>
                        )}
                    </Box>
                </>),
            },
        );
    }

    steps.push({
        title: 'You’re all set!',
        canNext: true,
        content: (<>
            <ul className="wizard-summary">
                <li><b>Table:</b> {table ? table.name : '—'}</li>
                <li><b>Latitude / Longitude:</b> {fieldName(GlobalConfigKeys.LATITUDE_FIELD)} / {fieldName(GlobalConfigKeys.LONGITUDE_FIELD)}</li>
                <li><b>Popup title:</b> {fieldName(GlobalConfigKeys.NAME_FIELD)}</li>
                {markerStyle === 'simple' ? (
                    <li><b>Marker style:</b> one shared icon and color</li>
                ) : (<>
                    <li><b>Marker icon:</b> {useSingleIcon ? (singleIconName || 'map') : `from “${fieldName(GlobalConfigKeys.BOX_ICON_FIELD)}”`}</li>
                    <li><b>Marker color:</b> {useSingleColor ? 'same for all markers' : `from “${fieldName(GlobalConfigKeys.COLOR_FIELD)}”`}</li>
                    <li><b>Marker size:</b> {useSingleIconSize ? `${singleIconSize ?? 32}px` : `from “${fieldName(GlobalConfigKeys.ICON_SIZE_FIELD)}”`}</li>
                </>)}
            </ul>
            <Text marginTop={2}>
                You can fine-tune everything later — clustering, fullscreen, a legend,
                a fixed start position — via the <i className="bx bx-cog" aria-hidden="true"/> settings
                button in the top right corner.
            </Text>
        </>),
    });

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
                        Open map
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
