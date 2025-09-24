import {
    Box,
    Button,
    FieldPickerSynced,
    FormField,
    Input,
    Select,
    Switch,
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
    USE_FIXED_START_LOCATION: 'useFixedStartLocation',
    START_LATITUDE: 'startLatitude',
    START_LONGITUDE: 'startLongitude',
    START_ZOOM: 'startZoom',
};

function Settings() {
    const base = useBase();
    const globalConfig = useGlobalConfig();
    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    const table = tableId ? base.getTableByIdIfExists(tableId) : null;

    // Helper function to validate the field selection
    const validateFieldSelection = (fieldKey, fieldLabel) => {
        const selectedField = globalConfig.get(fieldKey);
        if (!selectedField) {
            return <p style={{color: 'red'}}>{`${fieldLabel} is required`}</p>;
        }
        return null;
    };

    // check for permissions
    const permission = globalConfig.checkPermissionsForSetPaths(Object.entries(GlobalConfigKeys));
    if (permission.hasPermission === false) {
        return (<>
            <Box padding={3} className="about">
                <Text>You do not have permission to edit these settings</Text>
                <About/>
            </Box>
        </>);
    }


    return (<ErrorBoundary FallbackComponent={() => <Box padding={3}>Something went wrong!</Box>}>
        <Box padding={3}>
            <h1>Settings</h1>
            <details>
                <summary>Database config</summary>
                <Box marginTop={2}>
                    <FormField label="Table" description="Select the table containing your data">
                        <TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID}/>
                    </FormField>

                    {table && (<>
                        <FormField
                            label="Latitude Field"
                            // description="Choose the field with latitude values for marker placement"
                        >
                            <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LATITUDE_FIELD}
                                               allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}/>
                        </FormField>
                        {validateFieldSelection(GlobalConfigKeys.LATITUDE_FIELD, 'Latitude Field')}

                        <FormField
                            label="Longitude Field"
                            // description="Choose the field with longitude values for marker placement"
                        >
                            <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.LONGITUDE_FIELD}
                                               allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}/>
                        </FormField>
                        {validateFieldSelection(GlobalConfigKeys.LONGITUDE_FIELD, 'Longitude Field')}

                    </>)}

                    {!table && (<p style={{color: 'red'}}>
                        Please select a table to configure the settings.
                    </p>)}
                </Box>
            </details>

            <details>
                <summary>Marker config</summary>
                <Box marginTop={3}>
                    <FormField
                        label="Name Field"
                        // description="Select the field used to display names for the markers"
                    >
                        <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.NAME_FIELD}/>
                    </FormField>
                    {validateFieldSelection(GlobalConfigKeys.NAME_FIELD, 'Name Field')}

                    {/* Color Toggle */}
                    <FormField label="Marker Color">
                        <Switch
                            value={globalConfig.get(GlobalConfigKeys.USE_SINGLE_COLOR) || false}
                            onChange={(value) => globalConfig.setAsync(GlobalConfigKeys.USE_SINGLE_COLOR, value)}
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
                            <FormField label="Color Field">
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
                    <FormField label="Marker Icon">
                        <Switch
                            value={globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON) || false}
                            onChange={(value) => globalConfig.setAsync(GlobalConfigKeys.USE_SINGLE_ICON, value)}
                            label="Use a single icon for all markers"
                            size="large"
                        />
                        {globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON) ? (// Input for single icon value
                            <FormField label="Single Icon Name">
                                <Input
                                    value={globalConfig.get(GlobalConfigKeys.SINGLE_ICON_NAME) || ''}
                                    onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.SINGLE_ICON_NAME, e.target.value)}
                                    placeholder="Enter an icon name (e.g., bx-map)"
                                />
                            </FormField>) : (<>
                            {/* Field picker for icon names*/}
                            <FormField label="Icon Field">
                                <FieldPickerSynced
                                    table={table}
                                    globalConfigKey={GlobalConfigKeys.BOX_ICON_FIELD}
                                    allowedTypes={[FieldType.SINGLE_LINE_TEXT, FieldType.FORMULA]}
                                />
                            </FormField>
                            {validateFieldSelection(GlobalConfigKeys.BOX_ICON_FIELD, 'Icon Field')}
                        </>)}
                    </FormField>


                    <p>
                        Go to <a href="https://v2.boxicons.com/" target="_blank"
                                 rel="noopener noreferrer">v2.boxicons.com</a> to browse icon names.
                    </p>

                    {/* Icon Size Toggle */}
                    <FormField label="Marker Icon Size">
                        <Switch
                            value={globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON_SIZE) || false}
                            onChange={(value) => globalConfig.setAsync(GlobalConfigKeys.USE_SINGLE_ICON_SIZE, value)}
                            label="Use a single size for all markers"
                            size="large"
                        />
                        {globalConfig.get(GlobalConfigKeys.USE_SINGLE_ICON_SIZE) ? (<FormField label="Single Icon Size">
                            <Input
                                type="number"
                                value={globalConfig.get(GlobalConfigKeys.SINGLE_ICON_SIZE) || ''}
                                onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.SINGLE_ICON_SIZE, e.target.value)}
                                placeholder="Enter icon size (e.g., 20)"
                            />
                        </FormField>) : (<>
                            <FormField label="Icon Size Field">
                                <FieldPickerSynced
                                    table={table}
                                    globalConfigKey={GlobalConfigKeys.ICON_SIZE_FIELD}
                                    allowedTypes={[FieldType.NUMBER, FieldType.FORMULA]}
                                />
                            </FormField>
                            {validateFieldSelection(GlobalConfigKeys.ICON_SIZE_FIELD, 'Icon Size Field')}
                        </>)}
                    </FormField>
                </Box>
            </details>


            <details>
                <summary>Map config</summary>
                <Box marginTop={2}>
                    <Switch
                        value={globalConfig.get(GlobalConfigKeys.USE_CLUSTERING) || false}
                        onChange={(value) => globalConfig.setAsync(GlobalConfigKeys.USE_CLUSTERING, value)}
                        label="Use Clustering"
                        size="large"
                    />

                    <Switch
                        value={globalConfig.get(GlobalConfigKeys.ALLOW_FULL_SCREEN) || false}
                        onChange={(value) => globalConfig.setAsync(GlobalConfigKeys.ALLOW_FULL_SCREEN, value)}
                        label="Allow Fullscreen"
                        size="large"
                    />

                    <Switch
                        value={globalConfig.get(GlobalConfigKeys.GESTUREHANDLING) || false}
                        onChange={(value) => globalConfig.setAsync(GlobalConfigKeys.GESTUREHANDLING, value)}
                        label="Zoom with ctrl + scroll"
                        size="large"
                    />

                    <FormField label="Map start position">
                        <Switch
                            value={globalConfig.get(GlobalConfigKeys.USE_FIXED_START_LOCATION) || false}
                            onChange={(value) => globalConfig.setAsync(GlobalConfigKeys.USE_FIXED_START_LOCATION, value)}
                            label="Set a custom start position"
                            size="large"
                        />
                        {globalConfig.get(GlobalConfigKeys.USE_FIXED_START_LOCATION) ? (
                            <FormField label="">
                                <FormField label="Start Latitude">
                                    <Input
                                        type="number"
                                        value={globalConfig.get(GlobalConfigKeys.START_LATITUDE) || 0}
                                        onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.START_LATITUDE, e.target.value)}
                                        placeholder="Start Latitude"
                                    />
                                </FormField>
                                <FormField label="Start Longitude">
                                    <Input
                                        type="number"
                                        value={globalConfig.get(GlobalConfigKeys.START_LONGITUDE) || 0}
                                        onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.START_LONGITUDE, e.target.value)}
                                        placeholder="Start Longitude"
                                    />
                                </FormField>
                                <FormField label="Start Zoom">
                                    <Input
                                        type="number"
                                        value={globalConfig.get(GlobalConfigKeys.START_ZOOM) || 0}
                                        onChange={(e) => globalConfig.setAsync(GlobalConfigKeys.START_ZOOM, e.target.value)}
                                        placeholder="Start Zoom"
                                    />
                                </FormField>
                            </FormField>) : (<>
                        </>)}
                    </FormField>


                </Box>
            </details>

            <details>
                <summary>Legend</summary>
                <Box marginTop={2}>
                    <Legend/>
                </Box>
            </details>


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

function Legend() {
    // ----------------------------- utils --------------------------------------
    const HEX6 = /^#[0-9A-Fa-f]{6}$/;

    const uniqueId = () => {
        try {
            return crypto.randomUUID();
        } catch(e) {
            return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        }
    };

    // Does a given Boxicons class (e.g., "bx-home" / "bxs-map") render a ::before glyph?
    function hasGlyph(iconClass) {
        if (typeof window === "undefined") return true; // SSR-safe no-op
        if (!iconClass) return false;
        const wrap = document.createElement("div");
        wrap.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden;";
        const i = document.createElement("i");
        i.className = `bx ${iconClass}`;
        i.style.cssText = "display:inline-block;font-size:24px;";
        wrap.appendChild(i);
        document.body.appendChild(wrap);
        const cs = getComputedStyle(i, "::before");
        const raw = cs?.content || "";
        document.body.removeChild(wrap);
        const content = raw.replace(/^['"]|['"]$/g, "");
        return !!content && content !== "normal" && content !== "none";
    }

    // Resolve preview & suggestions for a raw icon input.
    // Bare names: try normal (bx-) then solid (bxs-). If both exist -> preview normal + suggest solid.
    function resolveIcon(raw) {
        const s = (raw || "").trim().toLowerCase().replace(/\s+/g, "");
        if (!s) return {previewClass: "", suggestions: [], error: ""};

        const hasPrefix = s.startsWith("bx-") || s.startsWith("bxs-") || s.startsWith("bxl-");
        if (hasPrefix) {
            const ok = hasGlyph(s);
            const suggestions = [];
            if (s.startsWith("bx-")) {
                const alt = "bxs-" + s.slice(3);
                if (hasGlyph(alt)) suggestions.push(alt);
            } else if (s.startsWith("bxs-")) {
                const alt = "bx-" + s.slice(4);
                if (hasGlyph(alt)) suggestions.push(alt);
            }
            return {previewClass: ok ? `bx ${s}` : "", suggestions, error: ok ? "" : "Icon not found."};
        }

        const name = s;
        const normal = `bx-${name}`;
        const solid = `bxs-${name}`;
        const normalOk = hasGlyph(normal);
        const solidOk = hasGlyph(solid);

        if (normalOk && solidOk) return {previewClass: `bx ${normal}`, suggestions: [solid], error: ""};
        if (normalOk) return {previewClass: `bx ${normal}`, suggestions: [], error: ""};
        if (solidOk) return {previewClass: `bx ${solid}`, suggestions: [], error: ""};
        return {previewClass: "", suggestions: [], error: "Icon not found."};
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
        if (hasGlyph("bx-circle")) {
            return <i className="bx bx-circle" style={{color, fontSize: 20, marginRight: 4}} aria-hidden="true"
                      title={title || "circle"}/>;
        }
        return <FallbackDot color={color} title={title}/>;
    }

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

    const showLegend = globalConfig.get(GlobalConfigKeys.SHOW_LEGEND) || false;
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
            <h3>Legend</h3>

            <Switch
                value={showLegend}
                onChange={(v) => globalConfig.setAsync(GlobalConfigKeys.SHOW_LEGEND, v)}
                label="Enable legend"
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
                                    style={{height: 30, padding: 0, border: "none", background: "transparent"}}
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
                                    {isIconTouched && suggestions.length > 0 && (
                                        <div style={{display: "inline-flex", gap: 8, flexWrap: "wrap", marginTop: 4}}>
                                            {suggestions.map((cls) => (
                                                <button
                                                    key={cls}
                                                    onClick={() => updateMarker(item.id, "icon", cls)}
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
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </ReactSortable>

            <h4>Add New Marker</h4>
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
                        style={{height: 30, padding: 0, border: "none", background: "transparent"}}
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
                    {addTouched.icon && addIconState.suggestions.length > 0 && (
                        <div style={{display: "inline-flex", gap: 8, flexWrap: "wrap", marginTop: 4}}>
                            {addIconState.suggestions.map((cls) => (
                                <button
                                    key={cls}
                                    onClick={() => setNewMarker({...newMarker, icon: cls})}
                                    style={{
                                        border: "1px solid #ddd",
                                        background: "#f5f5f5",
                                        borderRadius: 6,
                                        padding: "2px 8px",
                                        cursor: "pointer"
                                    }}
                                    title={`Use ${cls}`}
                                >
                                    Use <code>{cls}</code>
                                </button>
                            ))}
                        </div>
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
        <h2>About</h2>
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
