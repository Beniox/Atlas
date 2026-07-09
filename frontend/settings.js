import {
    Box,
    Button,
    ConfirmationDialog,
    FieldPickerSynced,
    FormField,
    Heading,
    Input,
    InputSynced,
    Select,
    SwitchSynced,
    TablePickerSynced,
    Text,
    useBase,
    useGlobalConfig
} from '@airtable/blocks/ui';
import {FieldType} from "@airtable/blocks/models";
import React from 'react';
import {ErrorBoundary} from "react-error-boundary";
import {ReactSortable} from "react-sortablejs";
import 'boxicons/css/boxicons.min.css';
import {hasBoxiconGlyph} from "./iconUtils";
import IconPickerDialog from "./iconPicker";
import "./style.css"

// Global Config Keys
export const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    LATITUDE_FIELD: 'latitudeFieldId',
    LONGITUDE_FIELD: 'longitudeFieldId',
    NAME_FIELD: 'nameFieldId',
    COLOR_FIELD: 'colorFieldId',
    BOX_ICON_FIELD: 'boxIconFieldId',
    ICON_SIZE_FIELD: 'iconSizeFieldId',
    USE_CLUSTERING: 'useClustering',
    ALLOW_FULL_SCREEN: 'allowFullScreen',
    SINGLE_ICON_NAME: 'singleIconName', // New key for single icon value
    USE_SINGLE_ICON: 'useSingleIcon',  // New key for toggle stat
    SINGLE_ICON_SIZE: 'singleIconSize',  // New key for single icon size
    USE_SINGLE_ICON_SIZE: 'useSingleIconSize',  // New key for icon size toggle
    SINGLE_COLOR: 'singleColor',  // New key for single color value
    USE_SINGLE_COLOR: 'useSingleColor',  // New key for color toggle
    LEGEND: 'legend',
    SHOW_LEGEND: 'showLegend',
    LEGEND_POSITION: 'legendPosition',
    GESTUREHANDLING: 'gestureHandling',
    SHOW_INVALID_WARNING: 'showInvalidWarning',
    SETUP_WIZARD_COMPLETED: 'setupWizardCompleted',
    USE_FIXED_START_LOCATION: 'useFixedStartLocation',
    START_LATITUDE: 'startLatitude',
    START_LONGITUDE: 'startLongitude',
    START_ZOOM: 'startZoom',
};

/**
 * Compute setup progress. Used by the settings UI (checklist, section badges)
 * and by index.js to decide whether the map can be shown.
 * A field only counts if it still exists in the selected table.
 */
export function getSetupStatus(globalConfig, base) {
    const get = (key) => globalConfig.get(key);
    const table = base.getTableByIdIfExists(get(GlobalConfigKeys.TABLE_ID));

    const hasField = (key) => {
        const fieldId = get(key);
        return !!(table && fieldId && table.getFieldByIdIfExists(fieldId));
    };

    const hasTable = !!table;
    const hasLocation = hasField(GlobalConfigKeys.LATITUDE_FIELD) && hasField(GlobalConfigKeys.LONGITUDE_FIELD);
    const hasName = hasField(GlobalConfigKeys.NAME_FIELD);

    const iconOk = get(GlobalConfigKeys.USE_SINGLE_ICON)
        ? !!get(GlobalConfigKeys.SINGLE_ICON_NAME)
        : hasField(GlobalConfigKeys.BOX_ICON_FIELD);
    const colorOk = get(GlobalConfigKeys.USE_SINGLE_COLOR)
        ? !!get(GlobalConfigKeys.SINGLE_COLOR)
        : hasField(GlobalConfigKeys.COLOR_FIELD);
    const sizeOk = get(GlobalConfigKeys.USE_SINGLE_ICON_SIZE)
        ? get(GlobalConfigKeys.SINGLE_ICON_SIZE) != null && get(GlobalConfigKeys.SINGLE_ICON_SIZE) !== ''
        : hasField(GlobalConfigKeys.ICON_SIZE_FIELD);
    const hasMarkerStyle = iconOk && colorOk && sizeOk;

    return {
        hasTable,
        hasLocation,
        hasName,
        hasMarkerStyle,
        isComplete: hasTable && hasLocation && hasName && hasMarkerStyle,
        steps: [
            {label: 'Select a table', done: hasTable},
            {label: 'Pick latitude & longitude fields', done: hasLocation},
            {label: 'Pick a name field for popups', done: hasName},
            {label: 'Choose a marker style (icon, color, size)', done: hasMarkerStyle},
        ],
    };
}

// Paths that seed a fresh (or freshly reset) config with sensible defaults:
// single icon/color/size marker style and marker warnings enabled.
// Only touches keys the user hasn't configured yet.
export function defaultConfigPaths(globalConfig) {
    const paths = [];
    if (globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON) === undefined
        && !globalConfig.get(GlobalConfigKeys.BOX_ICON_FIELD)) {
        paths.push({path: [GlobalConfigKeys.USE_SINGLE_ICON], value: true});
        if (!globalConfig.get(GlobalConfigKeys.SINGLE_ICON_NAME)) {
            paths.push({path: [GlobalConfigKeys.SINGLE_ICON_NAME], value: 'map'});
        }
    }
    if (globalConfig.get(GlobalConfigKeys.USE_SINGLE_COLOR) === undefined
        && !globalConfig.get(GlobalConfigKeys.COLOR_FIELD)) {
        paths.push({path: [GlobalConfigKeys.USE_SINGLE_COLOR], value: true});
        if (!globalConfig.get(GlobalConfigKeys.SINGLE_COLOR)) {
            paths.push({path: [GlobalConfigKeys.SINGLE_COLOR], value: '#2d7ff9'});
        }
    }
    if (globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON_SIZE) === undefined
        && !globalConfig.get(GlobalConfigKeys.ICON_SIZE_FIELD)) {
        paths.push({path: [GlobalConfigKeys.USE_SINGLE_ICON_SIZE], value: true});
        if (globalConfig.get(GlobalConfigKeys.SINGLE_ICON_SIZE) == null) {
            paths.push({path: [GlobalConfigKeys.SINGLE_ICON_SIZE], value: 32});
        }
    }
    if (globalConfig.get(GlobalConfigKeys.SHOW_INVALID_WARNING) === undefined) {
        paths.push({path: [GlobalConfigKeys.SHOW_INVALID_WARNING], value: true});
    }
    return paths;
}

// Paths that adapt the field config to the given table: drops field ids that
// belong to another table and auto-suggests latitude/longitude (by field name)
// and name (primary field).
export function autoConfigureFieldsPaths(table, globalConfig) {
    const paths = [];

    const FIELD_KEYS = [
        GlobalConfigKeys.LATITUDE_FIELD,
        GlobalConfigKeys.LONGITUDE_FIELD,
        GlobalConfigKeys.NAME_FIELD,
        GlobalConfigKeys.COLOR_FIELD,
        GlobalConfigKeys.BOX_ICON_FIELD,
        GlobalConfigKeys.ICON_SIZE_FIELD,
    ];
    const validFieldId = (key) => {
        const fieldId = globalConfig.get(key);
        return fieldId && table.getFieldByIdIfExists(fieldId) ? fieldId : null;
    };
    for (const key of FIELD_KEYS) {
        if (globalConfig.get(key) && !validFieldId(key)) {
            paths.push({path: [key], value: undefined}); // stale id from a previous table
        }
    }

    const numericFields = table.fields.filter(
        (f) => f.type === FieldType.NUMBER || f.type === FieldType.FORMULA
    );
    const findField = (matcher) => numericFields.find((f) => matcher(f.name.toLowerCase().trim()));

    if (!validFieldId(GlobalConfigKeys.LATITUDE_FIELD)) {
        const lat = findField((n) => n === 'lat' || n.includes('latitude'));
        if (lat) paths.push({path: [GlobalConfigKeys.LATITUDE_FIELD], value: lat.id});
    }
    if (!validFieldId(GlobalConfigKeys.LONGITUDE_FIELD)) {
        const lng = findField((n) => n === 'lng' || n === 'lon' || n === 'long' || n.includes('longitude'));
        if (lng) paths.push({path: [GlobalConfigKeys.LONGITUDE_FIELD], value: lng.id});
    }
    if (!validFieldId(GlobalConfigKeys.NAME_FIELD)) {
        paths.push({path: [GlobalConfigKeys.NAME_FIELD], value: table.primaryField.id});
    }

    return paths;
}

// Small "?" icon that explains a setting on hover, click or keyboard focus
function HelpIcon({text}) {
    const wrapRef = React.useRef(null);
    const [tipStyle, setTipStyle] = React.useState(undefined);

    // Keep the tooltip inside the extension area: clamp its horizontal
    // position to the pane, whichever side that requires.
    const updatePosition = () => {
        const el = wrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const margin = 12;
        const width = Math.min(230, window.innerWidth - 2 * margin);
        const ideal = rect.left - 8; // default: open to the right of the icon
        const clamped = Math.min(Math.max(ideal, margin), window.innerWidth - width - margin);
        setTipStyle({left: clamped - rect.left, maxWidth: width});
    };

    return (
        <span
            ref={wrapRef}
            className="help-icon-wrap"
            onMouseEnter={updatePosition}
            onClick={(e) => {
                // don't toggle the switch / focus the field the icon sits in
                e.preventDefault();
                e.stopPropagation();
                updatePosition();
            }}
        >
            <i className="bx bx-help-circle help-icon" tabIndex={0} aria-label={text} onFocus={updatePosition}/>
            <span className="help-tooltip" role="tooltip" style={tipStyle}>{text}</span>
        </span>
    );
}

// Green check / red hint shown in a section's <summary>
function SectionBadge({done}) {
    return done
        ? <span style={{color: 'green'}} aria-label="complete">✓</span>
        : <span style={{color: '#d93025', fontWeight: 'normal'}}> — action needed</span>;
}

// Step-by-step progress shown at the top of the settings
function SetupChecklist({steps, isComplete, onDone}) {
    const doneCount = steps.filter((s) => s.done).length;
    return (
        <Box className="setup-checklist">
            <Text fontWeight={600} marginBottom={1}>
                {isComplete
                    ? 'Setup complete — your map is ready.'
                    : `Getting started (${doneCount}/${steps.length})`}
            </Text>
            {steps.map((step) => (
                <Text key={step.label} style={{color: step.done ? 'green' : '#666'}}>
                    <i
                        className={`bx ${step.done ? 'bxs-check-circle' : 'bx-circle'}`}
                        style={{verticalAlign: 'middle', marginRight: 6}}
                        aria-hidden="true"
                    />
                    {step.label}
                </Text>
            ))}
            {isComplete && onDone && (
                <Button marginTop={2} variant="primary" onClick={onDone}>View map</Button>
            )}
        </Box>
    );
}

function Settings({onDone, openMarkerConfig = false, onReset}) {
    const base = useBase();
    const globalConfig = useGlobalConfig();
    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    const table = tableId ? base.getTableByIdIfExists(tableId) : null;

    const status = getSetupStatus(globalConfig, base);
    const databaseDone = status.hasTable && status.hasLocation;
    const markerDone = status.hasName && status.hasMarkerStyle;

    // Open the sections that still need attention (evaluated once, on mount,
    // so the user keeps control of the sections afterwards)
    const [initiallyOpen] = React.useState(() => ({
        database: !databaseDone,
        marker: openMarkerConfig || !markerDone,
    }));

    const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
    // Bumped after a reset to remount components that mirror config in local state
    const [resetNonce, setResetNonce] = React.useState(0);

    const resetAllSettings = async () => {
        setIsResetDialogOpen(false);
        try {
            await globalConfig.setPathsAsync(
                Object.values(GlobalConfigKeys).map((key) => ({path: [key], value: undefined}))
            );
            // back to the fresh-install defaults
            const defaults = defaultConfigPaths(globalConfig);
            if (defaults.length) await globalConfig.setPathsAsync(defaults);
            setResetNonce((n) => n + 1);
            if (onReset) onReset(); // e.g. hand over to the first-run wizard
        } catch (e) {
            console.error(e);
        }
    };

    // A focused number input captures wheel events (scrolling changes its
    // value instead of the page), which makes scrolling feel "stuck" until
    // the cursor moves — blur it as soon as the user scrolls.
    React.useEffect(() => {
        const onWheel = () => {
            const el = document.activeElement;
            if (el && el.tagName === 'INPUT' && el.type === 'number') el.blur();
        };
        document.addEventListener('wheel', onWheel, {passive: true});
        return () => document.removeEventListener('wheel', onWheel);
    }, []);

    // Fresh install: default the marker style to a single icon/color/size so
    // the map can render as soon as table + location fields are picked.
    React.useEffect(() => {
        if (!globalConfig.hasPermissionToSet()) return;
        const paths = defaultConfigPaths(globalConfig);
        if (paths.length) globalConfig.setPathsAsync(paths).catch((e) => console.error(e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When the table changes: drop field ids that belong to another table and
    // auto-suggest latitude/longitude (by field name) and name (primary field).
    React.useEffect(() => {
        if (!table || !globalConfig.hasPermissionToSet()) return;
        const paths = autoConfigureFieldsPaths(table, globalConfig);
        if (paths.length) globalConfig.setPathsAsync(paths).catch((e) => console.error(e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table && table.id]);

    // Helper function to validate the field selection
    const validateFieldSelection = (fieldKey, fieldLabel) => {
        const selectedField = globalConfig.get(fieldKey);
        if (!selectedField) {
            return <p className="settings-error">{`${fieldLabel} is required`}</p>;
        }
        return null;
    };

    // check for permissions
    if (!globalConfig.hasPermissionToSet()) {
        return (<>
            <Box padding={3} className="about">
                <Text>You do not have permission to edit these settings</Text>
                <About/>
            </Box>
        </>);
    }


    return (<ErrorBoundary FallbackComponent={() => <Box padding={3}>Something went wrong!</Box>}>
        <Box padding={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
                <Heading margin={0}>Settings</Heading>
                {onDone && (
                    <Button variant="primary" onClick={onDone} disabled={!status.isComplete}>
                        Done
                    </Button>
                )}
            </Box>

            <SetupChecklist steps={status.steps} isComplete={status.isComplete} onDone={onDone}/>

            <details open={initiallyOpen.database}>
                <summary>Database config <SectionBadge done={databaseDone}/></summary>
                <Box marginTop={2}>
                    <FormField label={<>Table <HelpIcon
                        text="The table that contains the records you want to show on the map."/></>}>
                        <TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID}/>
                    </FormField>

                    {table && (<>
                        <FormField
                            label={<>Latitude Field <HelpIcon
                                text="Number field with the north–south coordinate, from -90 to 90 (e.g. 52.5200)."/></>}
                        >
                            <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LATITUDE_FIELD}
                                               allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}/>
                        </FormField>
                        {validateFieldSelection(GlobalConfigKeys.LATITUDE_FIELD, 'Latitude Field')}

                        <FormField
                            label={<>Longitude Field <HelpIcon
                                text="Number field with the east–west coordinate, from -180 to 180 (e.g. 13.4050)."/></>}
                        >
                            <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LONGITUDE_FIELD}
                                               allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}/>
                        </FormField>
                        {validateFieldSelection(GlobalConfigKeys.LONGITUDE_FIELD, 'Longitude Field')}

                    </>)}

                    {!table && (<p className="settings-error">
                        Please select a table to configure the settings.
                    </p>)}
                </Box>
            </details>

            <details open={initiallyOpen.marker}>
                <summary>Marker config <SectionBadge done={markerDone}/></summary>
                <Box marginTop={3}>
                    {!table ? (<p className="settings-error">
                        Please select a table in &ldquo;Database config&rdquo; first.
                    </p>) : (<>
                    <FormField
                        label={<>Name Field <HelpIcon
                            text="Shown as the title of the popup that opens when a marker is clicked."/></>}
                    >
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.NAME_FIELD}/>
                    </FormField>
                    {validateFieldSelection(GlobalConfigKeys.NAME_FIELD, 'Name Field')}

                    {/* Color Toggle */}
                    <FormField label={<>Marker Color <HelpIcon
                        text="Give all markers one fixed color, or let a field decide the color per record."/></>}>
                        <SwitchSynced
                            globalConfigKey={GlobalConfigKeys.USE_SINGLE_COLOR}
                            label="Use a single color for all markers"
                            size="large"
                        />
                        {globalConfig.get(GlobalConfigKeys.USE_SINGLE_COLOR) ? (<FormField label="Single Color">
                            <input
                                value={globalConfig.get(GlobalConfigKeys.SINGLE_COLOR) || ''}
                                onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.SINGLE_COLOR, e.target.value)}
                                placeholder="Enter a color value (e.g., #FF5733)"
                                type={'color'}
                            />
                        </FormField>) : (<>
                            <FormField label={<>Color Field <HelpIcon
                                text="Single select fields use the option's color. Text or formula fields accept any CSS color, e.g. red, #00ff00 or rgba(0,0,0,0.5)."/></>}>
                                <FieldPickerSynced
                                    table={table}
                                    globalConfigKey={GlobalConfigKeys.COLOR_FIELD}
                                    allowedTypes={[FieldType.SINGLE_SELECT, FieldType.SINGLE_LINE_TEXT, FieldType.FORMULA,]}
                                />
                            </FormField>
                            {validateFieldSelection(GlobalConfigKeys.COLOR_FIELD, 'Color Field')}
                        </>)}
                    </FormField>


                    {/* Icon Toggle */}
                    <FormField label={<>Marker Icon <HelpIcon
                        text="Give all markers one fixed icon, or let a field decide the icon per record. Icons come from Boxicons."/></>}>
                        <SwitchSynced
                            globalConfigKey={GlobalConfigKeys.USE_SINGLE_ICON}
                            label="Use a single icon for all markers"
                            size="large"
                        />
                        {globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON) ? (// Input for single icon value
                            <SingleIconNameInput label={<>Single Icon Name <HelpIcon
                                text="A Boxicons icon name, e.g. map, bx-home or bxs-star. Browse all icons at v2.boxicons.com."/></>}/>) : (<>
                            {/* Field picker for icon names*/}
                            <FormField label={<>Icon Field <HelpIcon
                                text="Text or formula field with a Boxicons icon name per record, e.g. map, bx-home or bxs-star."/></>}>
                                <FieldPickerSynced
                                    table={table}
                                    globalConfigKey={GlobalConfigKeys.BOX_ICON_FIELD}
                                    allowedTypes={[FieldType.SINGLE_LINE_TEXT, FieldType.FORMULA]}
                                />
                            </FormField>
                            {validateFieldSelection(GlobalConfigKeys.BOX_ICON_FIELD, 'Icon Field')}
                        </>)}
                    </FormField>


                    {/* Icon Size Toggle */}
                    <FormField label={<>Marker Icon Size <HelpIcon
                        text="Give all markers one fixed size, or let a number field decide the size per record."/></>}>
                        <SwitchSynced
                            globalConfigKey={GlobalConfigKeys.USE_SINGLE_ICON_SIZE}
                            label="Use a single size for all markers"
                            size="large"
                        />
                        {globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON_SIZE) ? (<FormField label="Single Icon Size">
                            <Input
                                type="number"
                                value={globalConfig.get(GlobalConfigKeys.SINGLE_ICON_SIZE) ?? ''}
                                onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.SINGLE_ICON_SIZE,
                                    e.target.value === '' ? undefined : Number(e.target.value))}
                                placeholder="Enter icon size (e.g., 20)"
                            />
                        </FormField>) : (<>
                            <FormField label={<>Icon Size Field <HelpIcon
                                text="Number field with the marker size in pixels. 0 hides the marker; empty uses 32."/></>}>
                                <FieldPickerSynced
                                    table={table}
                                    globalConfigKey={GlobalConfigKeys.ICON_SIZE_FIELD}
                                    allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}
                                />
                            </FormField>
                            {validateFieldSelection(GlobalConfigKeys.ICON_SIZE_FIELD, 'Icon Size Field')}
                        </>)}
                    </FormField>
                    </>)}
                </Box>
            </details>


            <details>
                <summary>Map config (optional)</summary>
                <Box marginTop={2}>
                    <SwitchSynced
                        globalConfigKey={GlobalConfigKeys.USE_CLUSTERING}
                        label={<>Use Clustering <HelpIcon
                            text="Groups nearby markers into numbered bubbles that expand when you zoom in. Recommended for large datasets."/></>}
                        size="large"
                    />

                    <SwitchSynced
                        globalConfigKey={GlobalConfigKeys.ALLOW_FULL_SCREEN}
                        label={<>Allow Fullscreen <HelpIcon
                            text="Adds a button to the map that expands it to fill the whole screen."/></>}
                        size="large"
                    />

                    <SwitchSynced
                        globalConfigKey={GlobalConfigKeys.GESTUREHANDLING}
                        label={<>Zoom with ctrl + scroll <HelpIcon
                            text="Prevents accidental zooming while scrolling the page: the map only zooms with Ctrl + scroll (pinch on mobile)."/></>}
                        size="large"
                    />

                    <SwitchSynced
                        globalConfigKey={GlobalConfigKeys.SHOW_INVALID_WARNING}
                        label={<>Warn about invalid markers on the map <HelpIcon
                            text="Shows a warning on the map listing records that can't be placed (missing or invalid coordinates) or that use an unknown icon."/></>}
                        size="large"
                    />

                    <FormField label={<>Map start position <HelpIcon
                        text="By default the map centers to fit all markers. Enable this to always start at a fixed position and zoom level instead."/></>}>
                        <SwitchSynced
                            globalConfigKey={GlobalConfigKeys.USE_FIXED_START_LOCATION}
                            label="Set a custom start position"
                            size="large"
                        />
                        {globalConfig.get(GlobalConfigKeys.USE_FIXED_START_LOCATION) ? (
                            <FormField label="">
                                <FormField label="Start Latitude">
                                    <Input
                                        type="number"
                                        value={globalConfig.get(GlobalConfigKeys.START_LATITUDE) ?? 0}
                                        onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.START_LATITUDE,
                                            e.target.value === '' ? undefined : Number(e.target.value))}
                                        placeholder="Start Latitude"
                                    />
                                </FormField>
                                <FormField label="Start Longitude">
                                    <Input
                                        type="number"
                                        value={globalConfig.get(GlobalConfigKeys.START_LONGITUDE) ?? 0}
                                        onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.START_LONGITUDE,
                                            e.target.value === '' ? undefined : Number(e.target.value))}
                                        placeholder="Start Longitude"
                                    />
                                </FormField>
                                <FormField label={<>Start Zoom <HelpIcon
                                    text="How close the map starts: 0 shows the whole world, ~10 a city, 18 street level."/></>}>
                                    <Input
                                        type="number"
                                        value={globalConfig.get(GlobalConfigKeys.START_ZOOM) ?? 0}
                                        onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.START_ZOOM,
                                            e.target.value === '' ? undefined : Number(e.target.value))}
                                        placeholder="Start Zoom"
                                    />
                                </FormField>
                            </FormField>) : (<>
                        </>)}
                    </FormField>


                </Box>
            </details>

            <details>
                <summary>Legend (optional)</summary>
                <Box marginTop={2}>
                    <Legend key={resetNonce}/>
                </Box>
            </details>

            <Box marginTop={3}>
                <Button variant="danger" icon="trash" onClick={() => setIsResetDialogOpen(true)}>
                    Reset all settings
                </Button>
            </Box>

            {isResetDialogOpen && (
                <ConfirmationDialog
                    title="Reset all settings?"
                    body="This clears the entire map configuration (table, fields, marker style, legend, …)
                          for everyone using this extension. This cannot be undone."
                    confirmButtonText="Reset"
                    isConfirmActionDangerous={true}
                    onConfirm={resetAllSettings}
                    onCancel={() => setIsResetDialogOpen(false)}
                />
            )}

            <About/>
        </Box>
    </ErrorBoundary>);
}

function FallbackDot({color, size = 20, title = "Fallback icon"}) {
    return (
        <span
            aria-hidden="true"
            title={title}
            style={{
                display: "inline-block",
                width: size,
                height: size,
                borderRadius: "50%",
                backgroundColor: color || "#888",
                border: "1px solid rgba(0,0,0,.2)",
                marginRight: 4,
                verticalAlign: "middle",
            }}
        />
    );
}

// Does a given Boxicons class (e.g., "bx-home" / "bxs-map") render a ::before glyph?
function hasGlyph(iconClass) {
    if (typeof window === "undefined") return true; // SSR-safe no-op
    return hasBoxiconGlyph(iconClass); // shared + memoized
}

// Resolve preview & suggestions for a raw icon input.
// Bare names: try SOLID (bxs-) then NORMAL (bx-). If both exist -> preview SOLID + suggest NORMAL.
function resolveIcon(raw) {
    const s = (raw || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!s) return { previewClass: "", suggestions: [], error: "" };

    const hasPrefix = s.startsWith("bx-") || s.startsWith("bxs-") || s.startsWith("bxl-");
    if (hasPrefix) {
        const ok = hasGlyph(s);
        const suggestions = [];
        if (s.startsWith("bxs-")) {
            const alt = "bx-" + s.slice(4); // suggest normal when solid was typed
            if (hasGlyph(alt)) suggestions.push(alt);
        } else if (s.startsWith("bx-")) {
            const alt = "bxs-" + s.slice(3); // suggest solid when normal was typed
            if (hasGlyph(alt)) suggestions.push(alt);
        }
        return { previewClass: ok ? `bx ${s}` : "", suggestions, error: ok ? "" : "Icon not found." };
    }

    // Bare name -> prefer SOLID, then NORMAL
    const name   = s;
    const solid  = `bxs-${name}`;
    const normal = `bx-${name}`;
    const solidOk  = hasGlyph(solid);
    const normalOk = hasGlyph(normal);

    if (solidOk && normalOk)  return { previewClass: `bx ${solid}`,  suggestions: [normal], error: "" };
    if (solidOk)              return { previewClass: `bx ${solid}`,  suggestions: [],       error: "" };
    if (normalOk)             return { previewClass: `bx ${normal}`, suggestions: [],       error: "" };
    return { previewClass: "", suggestions: [], error: "Icon not found." };
}

// Acceptable to add? (empty => allowed circle; non-empty must resolve)
function isValidIconOrEmpty(raw) {
    const s = (raw || "").trim();
    if (!s) return true;
    const {previewClass} = resolveIcon(s);
    return !!previewClass;
}

// Render preview: resolved icon -> that class; else try bx-circle; else dot
function IconPreview({previewClass, color, title}) {
    if (previewClass) {
        return <i className={previewClass} style={{color, fontSize: 20, marginRight: 4}} aria-hidden="true"
                  title={title}/>;
    }
    if (hasGlyph("bxs-circle")) {
        return <i className="bx bxs-circle" style={{color, fontSize: 20, marginRight: 4}} aria-hidden="true"
                  title={title || "circle"}/>;
    }
    return <FallbackDot color={color} title={title}/>;
}

// One-click "Use bx-..." / "Use bxs-..." buttons for icon variant suggestions
function SuggestionChips({suggestions, onPick}) {
    if (!suggestions.length) return null;
    return (
        <div style={{display: "inline-flex", gap: 8, flexWrap: "wrap", marginTop: 4}}>
            {suggestions.map((cls) => (
                <button
                    key={cls}
                    onClick={() => onPick(cls)}
                    style={{
                        border: "1px solid #ddd",
                        background: "#f5f5f5",
                        borderRadius: 6,
                        padding: "2px 8px",
                        cursor: "pointer",
                    }}
                    title={`Use ${cls}`}
                >
                    Use <code>{cls}</code>
                </button>
            ))}
        </div>
    );
}

// "Single Icon Name" input with live preview, validation, variant suggestions
// and a searchable icon browser
export function SingleIconNameInput({label = "Single Icon Name"}) {
    const globalConfig = useGlobalConfig();
    const value = globalConfig.get(GlobalConfigKeys.SINGLE_ICON_NAME) || '';
    const useSingleColor = globalConfig.get(GlobalConfigKeys.USE_SINGLE_COLOR);
    const previewColor = (useSingleColor && globalConfig.get(GlobalConfigKeys.SINGLE_COLOR)) || '#333333';
    const [isPickerOpen, setIsPickerOpen] = React.useState(false);

    const {previewClass, suggestions} = resolveIcon(value);
    const isEmpty = !value.trim();
    const isInvalid = !isEmpty && !previewClass;

    return (
        <FormField label={label}>
            <div className="flex">
                {/* Preview what the map will show: the resolved icon, or the default map pin */}
                <IconPreview previewClass={previewClass || "bx bxs-map"} color={previewColor}
                             title={value || "default map pin"}/>
                <InputSynced
                    globalConfigKey={GlobalConfigKeys.SINGLE_ICON_NAME}
                    placeholder="Enter an icon name (e.g., bx-home / bxs-map / map)"
                    style={{borderColor: isEmpty || isInvalid ? 'red' : undefined}}
                    flex="1 1 auto"
                />
                <Button variant="secondary" icon="search" onClick={() => setIsPickerOpen(true)}>
                    Browse icons
                </Button>
            </div>
            {isPickerOpen && (
                <IconPickerDialog
                    onClose={() => setIsPickerOpen(false)}
                    onPick={(name) => {
                        globalConfig.setAsync(GlobalConfigKeys.SINGLE_ICON_NAME, name);
                        setIsPickerOpen(false);
                    }}
                />
            )}
            {isEmpty && <p className="settings-error">Icon name is required</p>}
            {isInvalid && (
                <p className="settings-error">
                    Icon not found — markers will fall back to the default map pin.
                </p>
            )}
            <SuggestionChips
                suggestions={suggestions}
                onPick={(cls) => globalConfig.setAsync(GlobalConfigKeys.SINGLE_ICON_NAME, cls)}
            />
        </FormField>
    );
}

function Legend() {
    // ----------------------------- utils --------------------------------------
    const HEX6 = /^#[0-9A-Fa-f]{6}$/;

    const uniqueId = () => {
        try {
            return crypto.randomUUID();
        } catch {
            return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        }
    };

    const sanitize = (item, idx) => ({
        id: item?.id || uniqueId() || idx,
        text: (item?.text || "").trim(),
        color: (item?.color || "#000000").trim(),
        icon: (item?.icon || "").trim(), // keep EXACT input (no auto-prefixing)
    });

    // ------------------------- global config ----------------------------------
    const globalConfig = useGlobalConfig();
    const LEGEND_POSITIONS = [
        {value: "topleft", label: "Top left"},
        {value: "topright", label: "Top right"},
        {value: "bottomleft", label: "Bottom left"},
        {value: "bottomright", label: "Bottom right"},
    ];

    const position = globalConfig.get(GlobalConfigKeys.LEGEND_POSITION) || "bottomleft";

    const initialItems = React.useMemo(() => {
        const raw = globalConfig.get(GlobalConfigKeys.LEGEND) || "[]";
        try {
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr.map(sanitize) : [];
        } catch (e) {
            console.error("[Legend] invalid LEGEND JSON:", e);
            return [];
        }
    }, []); // parse once

    // ------------------------------ state -------------------------------------
    const [items, setItems] = React.useState(initialItems);
    const [newMarker, setNewMarker] = React.useState({text: "", color: "#000000", icon: ""});
    const [formError, setFormError] = React.useState("");
    // Track per-item "touched" state for name & icon separately
    const [touched, setTouched] = React.useState({}); // { [id]: { text?:boolean, icon?:boolean } }
    // Track add-form touched state
    const [addTouched, setAddTouched] = React.useState({text: false, icon: false});

    // ---------------------------- persistence ---------------------------------
    const saveRef = React.useRef(null);
    React.useEffect(() => {
        if (saveRef.current) clearTimeout(saveRef.current);
        saveRef.current = setTimeout(async () => {
            try {
                const payload = items.map(({id, text, color, icon}) => ({id, text, color, icon}));
                await globalConfig.setAsync(GlobalConfigKeys.LEGEND, JSON.stringify(payload));
            } catch (e) {
                console.error("[Legend] save failed:", e);
            }
        }, 300);
        return () => clearTimeout(saveRef.current);
    }, [items, globalConfig]);

    // --------------------------- validation -----------------------------------
    const nameError = (s) => (!s.trim() ? "Name is required." : "");
    const iconErrorMsg = "Icon not found. Leave empty to use a circle.";

    const validateMarker = (m) => {
        if (nameError(m.text)) return nameError(m.text);
        if (!HEX6.test(m.color)) return "Please enter a valid hex color (e.g., #FF5733).";
        if (!isValidIconOrEmpty(m.icon)) return iconErrorMsg;
        return "";
    };

    // ------------------------------ actions -----------------------------------
    const deleteMarker = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

    const updateMarker = (id, key, value) => {
        setItems((prev) => prev.map((it) => (it.id === id ? {...it, [key]: value} : it)));
    };

    const onItemTextChange = (id, value) => {
        setTouched((prev) => ({...prev, [id]: {...(prev[id] || {}), text: true}}));
        updateMarker(id, "text", value);
    };

    const onItemIconChange = (id, value) => {
        setTouched((prev) => ({...prev, [id]: {...(prev[id] || {}), icon: true}}));
        updateMarker(id, "icon", value);
    };

    const addMarker = () => {
        const err = validateMarker(newMarker);
        if (err) {
            setFormError(err);
            return;
        }
        setItems((prev) => [...prev, {id: uniqueId(), ...newMarker}]);
        setNewMarker({text: "", color: "#000000", icon: ""});
        setFormError("");
        setAddTouched({text: false, icon: false});
    };

    // Live state for Add form
    const addIconState = resolveIcon(newMarker.icon);
    const addNameErr = nameError(newMarker.text);
    const addIconErr = isValidIconOrEmpty(newMarker.icon) ? "" : iconErrorMsg;

    const canSubmit =
        !addNameErr &&
        HEX6.test(newMarker.color) &&
        !addIconErr; // (empty icon counts as valid fallback)

    // ------------------------------- UI ---------------------------------------
    return (
        <div>
            <SwitchSynced
                globalConfigKey={GlobalConfigKeys.SHOW_LEGEND}
                label={<>Enable legend <HelpIcon
                    text="Shows a small box on the map that explains what your marker colors and icons mean. Define its entries below."/></>}
                size="large"
            />

            <Text>Select where the legend will appear on the map.</Text>

            <Select
                options={LEGEND_POSITIONS}
                value={position}
                onChange={(v) => globalConfig.setAsync(GlobalConfigKeys.LEGEND_POSITION, v)}
            />


            <ReactSortable list={items} setList={setItems} handle=".handle" animation={150}>
                {items.map((item) => {
                    const {previewClass, suggestions, error: iconErrCandidate} = resolveIcon(item.icon);
                    const isNameTouched = !!touched[item.id]?.text;
                    const isIconTouched = !!touched[item.id]?.icon;

                    const itemNameErr = nameError(item.text);
                    const showNameErr = isNameTouched && !!itemNameErr;

                    const itemIconErr = iconErrCandidate ? iconErrorMsg : "";
                    const showIconErr = isIconTouched && !!itemIconErr;

                    return (

                        <div
                            key={item.id}
                            className="legend-item"
                        >
                            <div className="flex">
                                <span className="handle" style={{cursor: "grab", marginRight: 4}}>
                                    <i className="bx bx-move"/>
                                </span>

                                {/* Preview: resolved icon; else circle fallback (or dot if font missing) */}
                                <IconPreview previewClass={previewClass} color={item.color}
                                             title={item.icon || "circle"}/>
                                <Input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => onItemTextChange(item.id, e.target.value)}
                                    onBlur={() => setTouched((prev) => ({
                                        ...prev,
                                        [item.id]: {...(prev[item.id] || {}), text: true}
                                    }))}
                                    placeholder="Name"
                                    style={{borderColor: showNameErr ? "red" : undefined}}
                                />

                                <input
                                    type="color"
                                    value={item.color}
                                    onChange={(e) => updateMarker(item.id, "color", e.target.value)}
                                    aria-label="Color"
                                />

                                {/* Raw icon input; no auto-prefix; mark touched on change/blur */}
                                <Input
                                    type="text"
                                    value={item.icon}
                                    onChange={(e) => onItemIconChange(item.id, e.target.value)}
                                    onBlur={() => setTouched((prev) => ({
                                        ...prev,
                                        [item.id]: {...(prev[item.id] || {}), icon: true}
                                    }))}
                                    placeholder="Icon (leave empty for circle, or e.g., bx-home / bxs-map / map)"
                                    style={{borderColor: showIconErr ? "red" : undefined}}
                                />


                                <button
                                    onClick={() => deleteMarker(item.id)}
                                    title="Delete"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "red",
                                        marginLeft: "auto"
                                    }}
                                >
                                    <i className="bx bx-trash"/>
                                </button>
                            </div>

                            {(showNameErr || showIconErr || (isIconTouched && suggestions.length > 0)) && (
                                <div style={{width: "100%", marginLeft: 28}}>
                                    {showNameErr && (
                                        <Text style={{color: "red", display: "block"}}>
                                            <strong>Name error:</strong> {itemNameErr}
                                        </Text>
                                    )}
                                    {showIconErr && (
                                        <Text style={{color: "red", display: "block"}}>
                                            <strong>Icon error:</strong> {itemIconErr}
                                        </Text>
                                    )}
                                    {isIconTouched && (
                                        <SuggestionChips
                                            suggestions={suggestions}
                                            onPick={(cls) => updateMarker(item.id, "icon", cls)}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </ReactSortable>

            <Heading size="xsmall" marginTop={3}>Add new marker</Heading>
            <Box className="add-marker-form" style={{display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap"}}>
                <div className="flex">
                    {/* Live preview for the add form: resolved icon or circle default */}
                    <IconPreview previewClass={addIconState.previewClass} color={newMarker.color}
                                 title={newMarker.icon || "circle"}/>

                    <Input
                        type="text"
                        value={newMarker.text}
                        onChange={(e) => {
                            setNewMarker({...newMarker, text: e.target.value});
                            if (!addTouched.text) setAddTouched((t) => ({...t, text: true}));
                        }}
                        onBlur={() => setAddTouched((t) => ({...t, text: true}))}
                        placeholder="Name"
                        required
                        style={{borderColor: addTouched.text && !!addNameErr ? "red" : undefined}}
                    />

                    <input
                        type="color"
                        value={newMarker.color}
                        onChange={(e) => setNewMarker({...newMarker, color: e.target.value})}
                        aria-label="Color"
                    />

                    <Input
                        type="text"
                        value={newMarker.icon}
                        onChange={(e) => {
                            setNewMarker({...newMarker, icon: e.target.value});
                            if (!addTouched.icon) setAddTouched((t) => ({...t, icon: true}));
                        }}
                        onBlur={() => setAddTouched((t) => ({...t, icon: true}))}
                        placeholder="Icon (leave empty for circle, or e.g., bx-home / bxs-map / map)"
                        required
                        style={{borderColor: addTouched.icon && !!addIconErr ? "red" : undefined}}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && canSubmit) addMarker();
                        }}
                    />
                </div>

                <Button onClick={addMarker} disabled={!canSubmit}
                        style={{cursor: canSubmit ? "pointer" : "not-allowed"}}>
                    Add Marker
                </Button>

                {/* Field-specific messages — only after touched */}
                <div style={{width: "100%"}}>
                    {addTouched.text && !!addNameErr && (
                        <Text style={{color: "red", display: "block"}}>
                            <strong>Name error:</strong> {addNameErr}
                        </Text>
                    )}
                    {addTouched.icon && !!addIconErr && (
                        <Text style={{color: "red", display: "block"}}>
                            <strong>Icon error:</strong> {addIconErr}
                        </Text>
                    )}
                    {/* Suggestions (only after icon touched) */}
                    {addTouched.icon && (
                        <SuggestionChips
                            suggestions={addIconState.suggestions}
                            onPick={(cls) => setNewMarker({...newMarker, icon: cls})}
                        />
                    )}
                    {/* Submit-time fallback errors (e.g., bad color) */}
                    {formError && (
                        <Text style={{color: "red", display: "block", marginTop: 4}}>
                            <strong>{formError}</strong>
                        </Text>
                    )}
                </div>
            </Box>

            <p style={{marginTop: 8}}>
                Default is a <em>circle</em> if the icon is empty. Bare names (e.g., <code>map</code>) preview the
                <em> normal</em> icon when available and offer the <em>solid</em> variant as a one-click option.
                Browse names at{" "}
                <a href="https://v2.boxicons.com/" target="_blank" rel="noopener noreferrer">
                    v2.boxicons.com
                </a>.
            </p>
        </div>
    );
}


function About() {
    return (<Box marginTop={3} className="about">
        <Heading size="small">About</Heading>
        <p>
            Made by Benjamin Stieler.
            <br/>
            <br/>

            For more information, feature requests, or bug reports, please visit my <a
            href="https://github.com/Beniox/atlas" target="_blank"
            rel="noopener noreferrer">GitHub</a>.

            <br/>
            <br/>

            <a href="https://boxicons.com/" target="_blank" rel="noopener noreferrer">
                BoxIcons
            </a>{' '}
            are used for icon rendering.
        </p>
    </Box>);
}

export default Settings;
